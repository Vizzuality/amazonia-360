variable "aws_profile" {
  type        = string
  description = "AWS profile to use to perform TF operations"
}

variable "allowed_account_id" {
  type        = string
  description = "AWS account id"
}

variable "project_name" {
  type        = string
  description = "Short name of the project, will be used to prefix created resources"
}

variable "repo_name" {
  type        = string
  description = "Name of the Github repository where the code is hosted"
}

variable "github_owner" {
  type        = string
  description = "Owner of the Github repository where the code is hosted"
}

variable "github_token" {
  type        = string
  description = "Github token to access the repository"
}

variable "ses_aws_region" {
  type        = string
  description = "AWS region for SES service (used across all environments)"
}

variable "ses_domain_name" {
  type        = string
  description = "Domain name to verify with SES"
  default     = "amazoniaforever360.org"
}

variable "ses_verified_emails" {
  type        = list(string)
  description = "List of email addresses to verify with SES"
  default     = []
}

variable "database_instance_class" {
  type        = string
  description = "The instance class for the RDS database"
  default     = "db.t3.micro"
}

variable "database_allocated_storage" {
  type        = number
  description = "The allocated storage in gigabytes for the RDS database (minimum 100 for gp3)"
  default     = 100
}

variable "database_backup_retention_period" {
  type        = number
  description = "The days to retain database backups"
  default     = 7
}

variable "dev" {
  type = object({
    aws_region = string
    api = object({
      auth_token      = string
      openai_token    = string
      tiff_path       = string
      grid_tiles_path = string
    })
    client = object({
      next_public_url            = string
      next_public_api_url        = string
      next_public_api_key        = string
      next_public_arcgis_api_key = string
      next_public_webshot_url    = string
      basic_auth_enabled         = string
      basic_auth_user            = string
      basic_auth_password        = string
    })
  })
}

variable "staging" {
  type = object({
    aws_region = string
    api = object({
      auth_token      = string
      openai_token    = string
      tiff_path       = string
      grid_tiles_path = string
    })
    client = object({
      next_public_url            = string
      next_public_api_url        = string
      next_public_api_key        = string
      next_public_arcgis_api_key = string
      next_public_webshot_url    = string
      basic_auth_enabled         = string
      basic_auth_user            = string
      basic_auth_password        = string
    })
  })
}

variable "prod" {
  type = object({
    aws_region = string
    api = object({
      auth_token      = string
      openai_token    = string
      tiff_path       = string
      grid_tiles_path = string
    })
    client = object({
      next_public_url            = string
      next_public_api_url        = string
      next_public_api_key        = string
      next_public_arcgis_api_key = string
      next_public_webshot_url    = string
      basic_auth_enabled         = string
      basic_auth_user            = string
      basic_auth_password        = string
    })
  })
}
