terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.14"
    }
  }

  // TF does not allow vars here. Use main vars or module outputs for other variables
  backend "s3" {
    profile = "amazonia360"
    bucket = "amazonia360-terraform-state"
    key = "terraform.tfstate"
    region = "eu-west-3"
    encrypt = true
    dynamodb_table = "amazonia360-terraform-state-lock"
  }

  required_version = "~> 1.9.0"
}

data "aws_vpc" "default_vpc" {
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
    values = [data.aws_vpc.default_vpc.id]
  }

  filter {
    name   = "availability-zone-id"
    values = ["${each.value}"]
  }
}

locals {
  subnets_with_ec2_instance_type_offering_ids = sort([
    for k, v in data.aws_subnets.subnets_with_ec2_instance_type_offering_map : v.ids[0]
  ])
}

# Terraform state persistence infra
module state {
  source = "./modules/state"
  project_name = var.project_name
  aws_region = var.aws_dev_region
  aws_profile = var.aws_profile
}

module "iam" {
  source = "./modules/iam"
}

module api_ecr {
  source = "./modules/ecr"
  project_name = var.project_name
  repo_name = "api"
}

module "github" {
  source       = "./modules/github"
  repo_name    = "amazonia-360"
  github_owner = var.github_owner
  github_token = var.github_token
  global_secret_map = {
    TF_PIPELINE_USER_ACCESS_KEY_ID     = module.iam.pipeline_user_access_key_id
    TF_PIPELINE_USER_SECRET_ACCESS_KEY = module.iam.pipeline_user_access_key_secret
    TF_API_REPOSITORY_NAME             = module.api_ecr.repository_name
    TF_AUTH_TOKEN                      = var.api_auth_token
  }
  global_variable_map = {
    TF_PROJECT_NAME                    = var.project_name
    TF_TIFF_PATH                       = var.api_tiff_path
    TF_GRID_TILES_PATH                 = var.api_grid_tiles_path
  }
}

resource "aws_iam_service_linked_role" "elasticbeanstalk" {
  aws_service_name = "elasticbeanstalk.amazonaws.com"
}

module "dev" {
  source                                        = "./modules/env"
  domain                                        = "dev.amazonia360.dev-vizzuality.com"
  project                                       = var.project_name
  environment                                   = "develop" # Does it need to be the same as the target branch name?
  aws_region                                    = var.aws_dev_region
  vpc                                           = data.aws_vpc.default_vpc
  subnet_ids                                    = local.subnets_with_ec2_instance_type_offering_ids
  availability_zones                            = data.aws_availability_zones.azs_with_ec2_instance_type_offering.names
  beanstalk_platform                            = "64bit Amazon Linux 2023 v4.4.0 running Docker"
  beanstalk_tier                                = "WebServer"
  ec2_instance_type                             = "t3.medium"
  elasticbeanstalk_iam_service_linked_role_name = aws_iam_service_linked_role.elasticbeanstalk.name
  repo_name                                     = "amazonia-360"
  cname_prefix                                  = "amazonia360-dev-environment"
  github_owner = var.github_owner
  github_token = var.github_token
  github_additional_environment_variables = {
    TF_AWS_REGION   = var.aws_dev_region
  }
}