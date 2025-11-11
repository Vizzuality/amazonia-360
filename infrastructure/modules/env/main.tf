terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.14"
    }
  }
}

data "aws_vpc" "vpc" {
  default = true
}

data "aws_availability_zones" "all_available_azs" {
  state = "available"
}

# THIS IS TO FILTER THE AVAILABLE ZONES BY EC2 INSTANCE TYPE AVAILABILITY
# returns zone ids that have the requested instance type available
data "aws_ec2_instance_type_offerings" "azs_with_ec2_instance_type_offering" {
  # filter {
  #   name   = "instance-type"
  #   values = ["m5a.large"]
  # }

  filter {
    name   = "location"
    values = data.aws_availability_zones.all_available_azs.zone_ids
  }

  location_type = "availability-zone-id"
}

# THIS IS TO FIND THE NAMES OF THOSE ZONES GIVEN BY IDS FROM ABOVE...
# because we need the names to pass to the staging module
data "aws_availability_zones" "azs_with_ec2_instance_type_offering" {
  filter {
    name   = "zone-id"
    values = sort(data.aws_ec2_instance_type_offerings.azs_with_ec2_instance_type_offering.locations)
  }
}

# THIS IS TO FILTER THE SUBNETS BY AVAILABILITY ZONES WITH EC2 INSTANCE TYPE AVAILABILITY
# so that we know which subnets can be passed to the beanstalk resource without upsetting it
data "aws_subnets" "subnets_with_ec2_instance_type_offering_map" {
  for_each = toset(
    data.aws_ec2_instance_type_offerings.azs_with_ec2_instance_type_offering.locations
  )

  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.vpc.id]
  }

  filter {
    name   = "availability-zone-id"
    values = ["${each.value}"]
  }
}

locals {
  subnet_ids = sort([
    for k, v in data.aws_subnets.subnets_with_ec2_instance_type_offering_map : v.ids[0]
  ])
}


module "beanstalk" {
  source                                        = "../beanstalk"
  project                                       = var.project
  environment                                   = var.environment
  region                                        = var.aws_region
  application_name                              = "${var.project}-${var.environment}"
  application_environment                       = "${var.project}-${var.environment}-environment"
  solution_stack_name                           = var.beanstalk_platform
  tier                                          = var.beanstalk_tier
  tags                                          = var.tags
  vpc                                           = data.aws_vpc.vpc
  public_subnets                                = local.subnet_ids
  elb_public_subnets                            = local.subnet_ids
  ec2_instance_type                             = var.ec2_instance_type
  domain                                        = var.domain
  domain_aliases                                = var.domain_aliases
  acm_certificate                               = aws_acm_certificate.acm_certificate
  acm_certificate_validation                    = aws_acm_certificate_validation.domain_certificate_validation
  acm_certificate_aliases                       = aws_acm_certificate.acm_certificate_aliases
  acm_certificate_alias_validations             = aws_acm_certificate_validation.alias_certificate_validation
  elasticbeanstalk_iam_service_linked_role_name = var.elasticbeanstalk_iam_service_linked_role_name
  cname_prefix                                  = var.cname_prefix
}

module "github" {
  source = "../github"
  repo_name    = var.repo_name
  github_owner = var.github_owner
  github_token = var.github_token
  github_environment = var.environment
  environment_secret_map = merge(local.api_secret_env_vars, var.github_additional_environment_secrets)
  environment_variable_map = merge(local.api_env_vars, var.github_additional_environment_variables)
}
