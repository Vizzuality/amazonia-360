variable "project" {
  type        = string
  description = "A project namespace for the infrastructure."
}

variable "environment" {
  type        = string
  description = "The name of the environment this server hosts"
}

variable "region" {
  type        = string
  description = "A valid AWS region to house VPC resources."
}

variable "application_name" {
  type    = string
  default = "myapp"
}
variable "application_environment" {
  type    = string
  default = "myenv"
}
variable "solution_stack_name" {
  type        = string
  description = "The Elastic Beanstalk platform / solution stack to use"
}
variable "tier" {
  type        = string
  description = "The Elastic Beanstalk tier to use"
}

variable "tags" {
  default     = {}
  type        = map(string)
  description = "A mapping of keys and values to apply as tags to all resources that support them."
}

variable "vpc" {}
variable "public_subnets" {}
variable "elb_public_subnets" {}

variable "ec2_instance_type" {
  type        = string
  description = "The type of EC2 instance to launch"
}


variable "domain" {
  type        = string
  description = "The domain name to use for the environment"
}

variable "acm_certificate" {
  type        = any
  description = "The ACM certificate to use for the environment"
}

variable "elasticbeanstalk_iam_service_linked_role_name" {
  type        = string
  description = "The IAM service linked role to use for the environment"
}

variable "cname_prefix" {
    type        = string
    description = "The CNAME prefix to use for the environment"
    default = null
}
