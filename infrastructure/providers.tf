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
  alias   = "prod"
  region  = var.prod.aws_region
  profile = var.aws_profile
}
