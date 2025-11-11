variable "aws_region" {
  type        = string
  description = "AWS region"
}

variable "domain" {
  type = string
}

variable "domain_aliases" {
  type        = list(string)
  description = "List of domain aliases that will redirect to the main domain"
  default     = []
}

variable "project" {
  type        = string
  description = "Short name of the project, will be used to prefix created resources"
}

variable "environment" {
  type        = string
  description = "Name of the environment, will be used to prefix created resources"
}

variable "tags" {
  default     = {}
  description = "Additional tags to add to resources"
}

variable "beanstalk_platform" {
  type        = string
  description = "The Elastic Beanstalk platform to use"
}

variable "beanstalk_tier" {
  type        = string
  description = "The Elastic Beanstalk tier to use"
}

variable "ec2_instance_type" {
  type        = string
  description = "EC2 instance type for the server"
}


variable "elasticbeanstalk_iam_service_linked_role_name" {
  type        = string
  description = "The IAM service linked role to use for the environment"
}

variable "repo_name" {
  type        = string
  description = "Name of the Github repository where the code is hosted"
}

variable "cname_prefix" {
  type        = string
  description = "The CNAME prefix to use for the environment"
  default     = null
}
variable "github_owner" {
  type        = string
  description = "Owner of the Github repository where the code is hosted"
}

variable "github_token" {
  type        = string
  description = "Github token to access the repository"
}

variable "contact_email" {
  type        = string
  description = "Email address where contact form submissions will be sent"
  default     = null
}

variable "github_additional_environment_secrets" {
  type        = map(string)
  description = "Github additional environment-specific secrets"
  default     = {}
}

variable "github_additional_environment_variables" {
  type        = map(string)
  description = "Github additional environment-specific variables"
  default     = {}
}
