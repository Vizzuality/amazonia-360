provider "aws" {
  region  = var.region
  profile = var.profile
}

module "ec2" {
  source         = "./modules/ec2"
  ami            = "ami-0322211ccfe5b6a20"
  instance_type  = "t3.small"
  subnet_id      = module.vpc.subnet_id
  instance_name  = "amazonia360-ec2"
  security_groups = [module.vpc.security_group_id]
}

module "vpc" {
  source         = "./modules/vpc"
  vpc_cidr_block = "10.0.0.0/16"
  vpc_name       = "amazonia360-vpc"
}