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

# Terraform state persistence infra
module state {
  source = "./modules/state"
  project_name = var.project_name
  aws_region = var.dev.aws_region
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

module client_ecr {
  source = "./modules/ecr"
  project_name = var.project_name
  repo_name = "client"
}

## Specifically for production, as the deployment points to the production region to push the images to the ECR
## so we need to have a ECR in said region
module client_prod_ecr {
  providers = {
    aws = aws.prod
  }
  source = "./modules/ecr"
  project_name = var.project_name
  repo_name = "client"
}

module api_prod_ecr {
  providers = {
    aws = aws.prod
  }
  source = "./modules/ecr"
  project_name = var.project_name
  repo_name = "api"
}


module "github" {
  source       = "./modules/github"
  repo_name    = var.repo_name
  github_owner = var.github_owner
  github_token = var.github_token
  global_secret_map = {
    TF_PIPELINE_USER_ACCESS_KEY_ID     = module.iam.pipeline_user_access_key_id
    TF_PIPELINE_USER_SECRET_ACCESS_KEY = module.iam.pipeline_user_access_key_secret

    # API
    TF_API_REPOSITORY_NAME             = module.api_ecr.repository_name
    OPENAI_TOKEN                       = var.openai_token

    # Client
    TF_CLIENT_REPOSITORY_NAME          = module.client_ecr.repository_name


  }
  global_variable_map = {
    TF_PROJECT_NAME                    = var.project_name

    # API
    # Client
  }
}

resource "aws_iam_service_linked_role" "elasticbeanstalk" {
  aws_service_name = "elasticbeanstalk.amazonaws.com"
}

module "dev" {
  source                                        = "./modules/env"
  providers = {
    aws = aws.dev
  }

  domain                                        = "dev.amazoniaforever360.org"
  project                                       = var.project_name
  environment                                   = "develop"
  aws_region                                    = var.dev.aws_region
  beanstalk_platform                            = "64bit Amazon Linux 2023 v4.4.1 running Docker"
  beanstalk_tier                                = "WebServer"
  ec2_instance_type                             = "t3.medium"
  elasticbeanstalk_iam_service_linked_role_name = aws_iam_service_linked_role.elasticbeanstalk.name
  repo_name                                     = var.repo_name
  cname_prefix                                  = "amazonia360-dev-environment"
  github_owner = var.github_owner
  github_token = var.github_token
  github_additional_environment_variables = {
    TF_AWS_REGION   = var.dev.aws_region


    # API
    TF_API_TIFF_PATH                       = var.dev.api.tiff_path
    TF_API_GRID_TILES_PATH                 = var.dev.api.grid_tiles_path

    # Client
    TF_CLIENT_NEXT_PUBLIC_API_URL = var.dev.client.next_public_api_url
    TF_CLIENT_BASIC_AUTH_ENABLED = var.dev.client.basic_auth_enabled
  }
  github_additional_environment_secrets = {
    # API
    TF_API_AUTH_TOKEN = var.dev.api.auth_token

    # Client
    TF_CLIENT_NEXT_PUBLIC_API_KEY = var.dev.client.next_public_api_key
    TF_CLIENT_NEXT_PUBLIC_ARCGIS_API_KEY = var.dev.client.next_public_arcgis_api_key
    TF_CLIENT_BASIC_AUTH_USER = var.dev.client.basic_auth_user
    TF_CLIENT_BASIC_AUTH_PASSWORD = var.dev.client.basic_auth_password

    TF_NEXT_PUBLIC_FEATURE_PARTNERS = var.dev.client.next_public_feature_partners
  }
}

module "staging" {
  source                                        = "./modules/env"
  providers = {
    aws = aws.dev
  }

  domain                                        = "staging.amazoniaforever360.org"
  project                                       = var.project_name
  environment                                   = "staging"
  aws_region                                    = var.staging.aws_region
  beanstalk_platform                            = "64bit Amazon Linux 2023 v4.4.1 running Docker"
  beanstalk_tier                                = "WebServer"
  ec2_instance_type                             = "t3.medium"
  elasticbeanstalk_iam_service_linked_role_name = aws_iam_service_linked_role.elasticbeanstalk.name
  repo_name                                     = var.repo_name
  cname_prefix                                  = "amazonia360-staging-environment"
  github_owner = var.github_owner
  github_token = var.github_token
  github_additional_environment_variables = {
    TF_AWS_REGION   = var.staging.aws_region

    # API
    TF_API_TIFF_PATH                       = var.staging.api.tiff_path
    TF_API_GRID_TILES_PATH                 = var.staging.api.grid_tiles_path

    # Client
    TF_CLIENT_NEXT_PUBLIC_API_URL = var.staging.client.next_public_api_url
    TF_CLIENT_BASIC_AUTH_ENABLED = var.staging.client.basic_auth_enabled
  }
  github_additional_environment_secrets = {
    # API
    TF_API_AUTH_TOKEN = var.staging.api.auth_token

    # Client
    TF_CLIENT_NEXT_PUBLIC_API_KEY = var.staging.client.next_public_api_key
    TF_CLIENT_NEXT_PUBLIC_ARCGIS_API_KEY = var.staging.client.next_public_arcgis_api_key

    TF_NEXT_PUBLIC_FEATURE_PARTNERS = var.staging.client.next_public_feature_partners

    TF_CLIENT_BASIC_AUTH_USER = var.staging.client.basic_auth_user
    TF_CLIENT_BASIC_AUTH_PASSWORD = var.staging.client.basic_auth_password
  }
}

module "prod" {
  source                                        = "./modules/env"
  providers = {
    aws = aws.prod
  }

  domain                                        = "beta.amazoniaforever360.org"
  project                                       = var.project_name
  environment                                   = "production"
  aws_region                                    = var.prod.aws_region
  beanstalk_platform                            = "64bit Amazon Linux 2023 v4.4.1 running Docker"
  beanstalk_tier                                = "WebServer"
  ec2_instance_type                             = "t3.medium"
  elasticbeanstalk_iam_service_linked_role_name = aws_iam_service_linked_role.elasticbeanstalk.name
  repo_name                                     = var.repo_name
  cname_prefix                                  = "amazonia360-prod-environment"
  github_owner = var.github_owner
  github_token = var.github_token
  github_additional_environment_variables = {
    TF_AWS_REGION   = var.prod.aws_region

    # API
    TF_API_TIFF_PATH                       = var.prod.api.tiff_path
    TF_API_GRID_TILES_PATH                 = var.prod.api.grid_tiles_path

    # Client
    TF_CLIENT_NEXT_PUBLIC_API_URL = var.prod.client.next_public_api_url
    TF_CLIENT_BASIC_AUTH_ENABLED = var.prod.client.basic_auth_enabled
  }
  github_additional_environment_secrets = {
    # API
    TF_API_AUTH_TOKEN = var.prod.api.auth_token

    # Client
    TF_CLIENT_NEXT_PUBLIC_API_KEY = var.prod.client.next_public_api_key
    TF_CLIENT_NEXT_PUBLIC_ARCGIS_API_KEY = var.prod.client.next_public_arcgis_api_key
    TF_NEXT_PUBLIC_FEATURE_PARTNERS = var.prod.client.next_public_feature_partners
    TF_CLIENT_BASIC_AUTH_USER = var.prod.client.basic_auth_user
    TF_CLIENT_BASIC_AUTH_PASSWORD = var.prod.client.basic_auth_password
  }
}