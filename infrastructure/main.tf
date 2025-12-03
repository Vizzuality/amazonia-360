terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.20"
    }
  }

  // TF does not allow vars here. Use main vars or module outputs for other variables
  backend "s3" {
    profile        = "amazonia360"
    bucket         = "amazonia360-terraform-state"
    key            = "terraform.tfstate"
    region         = "eu-west-3"
    encrypt        = true
    dynamodb_table = "amazonia360-terraform-state-lock"
  }

  required_version = "~> 1.10.0"
}

# Terraform state persistence infra
module "state" {
  source       = "./modules/state"
  project_name = var.project_name
  aws_region   = var.dev.aws_region
  aws_profile  = var.aws_profile
}

module "iam" {
  source  = "./modules/iam"
  project = var.project_name
}

module "api_ecr" {
  source       = "./modules/ecr"
  project_name = var.project_name
  repo_name    = "api"
}

module "client_ecr" {
  source       = "./modules/ecr"
  project_name = var.project_name
  repo_name    = "client"
}

module "webshot_ecr" {
  source       = "./modules/ecr"
  project_name = var.project_name
  repo_name    = "webshot"
}

## Specifically for production, as the deployment points to the production region to push the images to the ECR
## so we need to have a ECR in said region
module "client_prod_ecr" {
  providers = {
    aws = aws.prod
  }
  source       = "./modules/ecr"
  project_name = var.project_name
  repo_name    = "client"
}

module "api_prod_ecr" {
  providers = {
    aws = aws.prod
  }
  source       = "./modules/ecr"
  project_name = var.project_name
  repo_name    = "api"
}

module "webshot_prod_ecr" {
  providers = {
    aws = aws.prod
  }
  source       = "./modules/ecr"
  project_name = var.project_name
  repo_name    = "webshot"
}

module "ses" {
  source              = "./modules/ses"
  ses_aws_region      = var.ses_aws_region
  ses_domain_name     = var.ses_domain_name
  ses_verified_emails = var.ses_verified_emails
}

module "github" {
  source       = "./modules/github"
  repo_name    = var.repo_name
  github_owner = var.github_owner
  github_token = var.github_token
  global_secret_map = {
    TF_PIPELINE_USER_SECRET_ACCESS_KEY = module.iam.pipeline_user_secret_access_key
    TF_S3_SYNCS_USER_SECRET_ACCESS_KEY = module.iam.s3_syncs_user_secret_access_key
  }
  global_variable_map = {
    TF_PIPELINE_USER_ACCESS_KEY_ID = module.iam.pipeline_user_access_key_id
    TF_S3_SYNCS_USER_ACCESS_KEY_ID = module.iam.s3_syncs_user_access_key_id
    TF_PROJECT_NAME                = var.project_name

    # API
    TF_API_REPOSITORY_NAME = module.api_ecr.repository_name

    # Client
    TF_CLIENT_REPOSITORY_NAME = module.client_ecr.repository_name

    # Webshot
    TF_WEBSHOT_REPOSITORY_NAME = module.webshot_ecr.repository_name
  }
}

resource "aws_iam_service_linked_role" "elasticbeanstalk" {
  aws_service_name = "elasticbeanstalk.amazonaws.com"
}

module "dev" {
  source = "./modules/env"
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
  github_owner                                  = var.github_owner
  github_token                                  = var.github_token
  github_additional_environment_variables = {
    TF_AWS_REGION = var.dev.aws_region

    # SES
    TF_AWS_SES_REGION                 = var.ses_aws_region
    TF_AWS_SES_IAM_USER_ACCESS_KEY_ID = module.dev.ses_iam_user_access_key_id

    # API
    TF_API_TIFF_PATH       = var.dev.api.tiff_path
    TF_API_GRID_TILES_PATH = var.dev.api.grid_tiles_path

    # Client
    TF_CLIENT_NEXT_PUBLIC_API_URL     = var.dev.client.next_public_api_url
    TF_CLIENT_NEXT_PUBLIC_WEBSHOT_URL = var.dev.client.next_public_webshot_url
    TF_CLIENT_BASIC_AUTH_ENABLED      = var.dev.client.basic_auth_enabled
  }
  github_additional_environment_secrets = {
    # SES
    TF_AWS_SES_IAM_USER_SECRET_ACCESS_KEY = module.dev.ses_iam_user_secret_access_key

    # API
    TF_API_AUTH_TOKEN   = var.dev.api.auth_token
    TF_API_OPENAI_TOKEN = var.dev.api.openai_token

    # Client
    TF_CLIENT_NEXT_PUBLIC_API_KEY        = var.dev.client.next_public_api_key
    TF_CLIENT_NEXT_PUBLIC_ARCGIS_API_KEY = var.dev.client.next_public_arcgis_api_key
    TF_CLIENT_BASIC_AUTH_USER            = var.dev.client.basic_auth_user
    TF_CLIENT_BASIC_AUTH_PASSWORD        = var.dev.client.basic_auth_password

    TF_CLIENT_PAYLOAD_SECRET = var.dev.client.payload_secret
    TF_CLIENT_DATABASE_URL   = var.dev.client.database_url
    TF_CLIENT_APP_KEY        = var.dev.client.app_key
    TF_CLIENT_AUTH_SECRET    = var.dev.client.auth_secret
  }
}

module "staging" {
  source = "./modules/env"
  providers = {
    aws = aws.staging
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
  github_owner                                  = var.github_owner
  github_token                                  = var.github_token
  github_additional_environment_variables = {
    TF_AWS_REGION = var.staging.aws_region

    # SES
    TF_AWS_SES_REGION                 = var.ses_aws_region
    TF_AWS_SES_IAM_USER_ACCESS_KEY_ID = module.staging.ses_iam_user_access_key_id

    # API
    TF_API_TIFF_PATH       = var.staging.api.tiff_path
    TF_API_GRID_TILES_PATH = var.staging.api.grid_tiles_path

    # Client
    TF_CLIENT_NEXT_PUBLIC_API_URL     = var.staging.client.next_public_api_url
    TF_CLIENT_NEXT_PUBLIC_WEBSHOT_URL = var.staging.client.next_public_webshot_url
    TF_CLIENT_BASIC_AUTH_ENABLED      = var.staging.client.basic_auth_enabled
  }
  github_additional_environment_secrets = {
    # SES
    TF_AWS_SES_IAM_USER_SECRET_ACCESS_KEY = module.staging.ses_iam_user_secret_access_key

    # API
    TF_API_AUTH_TOKEN   = var.staging.api.auth_token
    TF_API_OPENAI_TOKEN = var.staging.api.openai_token

    # Client
    TF_CLIENT_NEXT_PUBLIC_API_KEY        = var.staging.client.next_public_api_key
    TF_CLIENT_NEXT_PUBLIC_ARCGIS_API_KEY = var.staging.client.next_public_arcgis_api_key

    TF_CLIENT_BASIC_AUTH_USER     = var.staging.client.basic_auth_user
    TF_CLIENT_BASIC_AUTH_PASSWORD = var.staging.client.basic_auth_password

    TF_CLIENT_PAYLOAD_SECRET = var.staging.client.payload_secret
    TF_CLIENT_DATABASE_URL   = var.staging.client.database_url
    TF_CLIENT_APP_KEY        = var.staging.client.app_key
    TF_CLIENT_AUTH_SECRET    = var.staging.client.auth_secret
  }
}

module "prod" {
  source = "./modules/env"
  providers = {
    aws = aws.prod
  }

  domain                                        = "amazoniaforever360.org"
  project                                       = var.project_name
  environment                                   = "production"
  aws_region                                    = var.prod.aws_region
  beanstalk_platform                            = "64bit Amazon Linux 2023 v4.4.1 running Docker"
  beanstalk_tier                                = "WebServer"
  ec2_instance_type                             = "t3.medium"
  elasticbeanstalk_iam_service_linked_role_name = aws_iam_service_linked_role.elasticbeanstalk.name
  repo_name                                     = var.repo_name
  cname_prefix                                  = "amazonia360-prod-environment"
  github_owner                                  = var.github_owner
  github_token                                  = var.github_token
  github_additional_environment_variables = {
    TF_AWS_REGION = var.prod.aws_region

    # SES
    TF_AWS_SES_REGION                 = var.ses_aws_region
    TF_AWS_SES_IAM_USER_ACCESS_KEY_ID = module.prod.ses_iam_user_access_key_id

    # API
    TF_API_TIFF_PATH       = var.prod.api.tiff_path
    TF_API_GRID_TILES_PATH = var.prod.api.grid_tiles_path

    # Client
    TF_CLIENT_NEXT_PUBLIC_API_URL     = var.prod.client.next_public_api_url
    TF_CLIENT_NEXT_PUBLIC_WEBSHOT_URL = var.prod.client.next_public_webshot_url
    TF_CLIENT_BASIC_AUTH_ENABLED      = var.prod.client.basic_auth_enabled
  }
  github_additional_environment_secrets = {
    # SES
    TF_AWS_SES_IAM_USER_SECRET_ACCESS_KEY = module.prod.ses_iam_user_secret_access_key

    # API
    TF_API_AUTH_TOKEN   = var.prod.api.auth_token
    TF_API_OPENAI_TOKEN = var.prod.api.openai_token

    # Client
    TF_CLIENT_NEXT_PUBLIC_API_KEY        = var.prod.client.next_public_api_key
    TF_CLIENT_NEXT_PUBLIC_ARCGIS_API_KEY = var.prod.client.next_public_arcgis_api_key
    TF_CLIENT_BASIC_AUTH_USER            = var.prod.client.basic_auth_user
    TF_CLIENT_BASIC_AUTH_PASSWORD        = var.prod.client.basic_auth_password

    TF_CLIENT_PAYLOAD_SECRET = var.prod.client.payload_secret
    TF_CLIENT_DATABASE_URL   = var.prod.client.database_url
    TF_CLIENT_APP_KEY        = var.prod.client.app_key
    TF_CLIENT_AUTH_SECRET    = var.prod.client.auth_secret
  }
}
