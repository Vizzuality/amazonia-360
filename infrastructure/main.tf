terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "~> 5.10.0"
    }

  }
 backend "s3" {
   region         = "eu-west-3"
   key            = "core.tfstate"
   dynamodb_table = "tf-lock-state"
   encrypt        = true
   profile        = "amazonia360"
   bucket         = "amazonioa360-tfstate-bucket"
 }
}


module "ec2" {
  source         = "./modules/ec2"
  environment = "prod"
  ami            = "ami-0db612899f2542162"
  instance_type  = "t2.large"
  subnet_id      = module.vpc.subnet_id
  instance_name  = "amazonia360-ec2"
  security_group_ids = [module.vpc.security_group_id]
  ec2_public_key  = var.ec2_public_key
  authorized_key = var.authorized_key
}


module "ec2-dev" {
  source         = "./modules/ec2"
  environment = "dev"
  ami            = "ami-0db612899f2542162"
  instance_type  = "t2.small"
  subnet_id      = module.vpc.subnet_id
  instance_name  = "amazonia360-ec2-dev"
  security_group_ids = [module.vpc.security_group_id]
  ec2_public_key  = var.ec2_public_key
  authorized_key = var.authorized_key
}

module "vpc" {
  source         = "./modules/vpc"
  vpc_cidr_block = "10.0.0.0/16"
  vpc_name       = "amazonia360-vpc"
  ec2_instance_id = module.ec2.instance_id
  ec2_dev_instance_id = module.ec2-dev.instance_id
}

module "s3" {
   source = "./modules/s3"
   tf-state-bucket-name = "amazonioa360-tfstate-bucket"
}


