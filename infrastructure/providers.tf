provider "aws" {
  region  = var.dev.aws_region
  profile = var.aws_profile
}

provider "aws" {
  alias   = "dev"
  region  = var.dev.aws_region
  profile = var.aws_profile
}

provider "aws" {
  alias   = "staging"
  region  = var.staging.aws_region
  profile = var.aws_profile
}

provider "aws" {
  alias   = "prod"
  region  = var.prod.aws_region
  profile = var.aws_profile
}

# Provider for the state region (eu-west-3) where shared resources like
# tfvars backup secret are stored alongside the Terraform state
provider "aws" {
  alias   = "state_region"
  region  = "eu-west-3"
  profile = var.aws_profile
}
