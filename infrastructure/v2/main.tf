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

module state {
  source = "./modules/state"
  project_name = var.project_name
  aws_region = var.aws_eu_region
  aws_profile = var.aws_profile
}
