module "beanstalk" {
  source = "../beanstalk"
  project                                       = var.project
  environment                                   = var.environment
  region                                        = var.aws_region
  application_name                              = "${var.project}-${var.environment}"
  application_environment                       = "${var.project}-${var.environment}-environment"
  solution_stack_name                           = var.beanstalk_platform
  tier                                          = var.beanstalk_tier
  tags                                          = var.tags
  vpc                                           = var.vpc
  public_subnets                                = var.subnet_ids
  elb_public_subnets                            = var.subnet_ids
  ec2_instance_type                             = var.ec2_instance_type
  domain                                        = var.domain
  acm_certificate                               = aws_acm_certificate.acm_certificate
  elasticbeanstalk_iam_service_linked_role_name = var.elasticbeanstalk_iam_service_linked_role_name
  cname_prefix                                  = var.cname_prefix
}

module "github" {
  source = "../github"
  repo_name    = "amazonia-360"
  github_owner = var.github_owner
  github_token = var.github_token
  github_environment = var.environment
  environment_secret_map = merge(local.api_secret_env_vars, var.github_additional_environment_secrets)
  environment_variable_map = merge(local.api_env_vars, var.github_additional_environment_variables)
}



