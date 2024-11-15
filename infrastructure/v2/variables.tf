variable "aws_profile" {
  type        = string
  description = "AWS profile to use to perform TF operations"
}

variable "aws_eu_region" {
  type    = string
  default = "eu-west-3"
}

variable "aws_sa_region" {
  type    = string
  default = "sa-east-1"
}

variable "allowed_account_id" {
  type        = string
  description = "AWS account id"
}

variable "project_name" {
  type        = string
  description = "Short name of the project, will be used to prefix created resources"
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

}