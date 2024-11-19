variable "aws_profile" {
  type        = string
  description = "AWS profile to use to perform TF operations"
}

variable "aws_dev_region" {
  type    = string
  default = "eu-west-3"
}

variable "aws_prod_region" {
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

variable "api_auth_token" {
  type        = string
  description = "API auth token"
}

variable "api_tiff_path" {
  type        = string
  description = "API TIFF file path"
}

variable "api_grid_tiles_path" {
  type        = string
  description = "API Grid tiles file path"
}