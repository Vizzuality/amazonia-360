variable "aws_region" {
  type        = string
  description = "AWS region"
  default     = "eu-west-3"
}

variable "project_name" {
  type        = string
  description = "Short name of the project, will be used to prefix created resources"
}

variable "aws_profile" {
    type        = string
    description = "AWS profile to use to perform TF operations"
}

