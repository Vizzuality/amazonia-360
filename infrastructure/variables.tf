variable "aws_profile" {
  type        = string
  description = "AWS profile to use to perform TF operations"
}

variable openai_token {
    type = string
    description = "OpenAI API token"
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

variable "dev" {
  type = object({
    aws_region = string
    api = object({
      auth_token      = string
      tiff_path       = string
      grid_tiles_path = string
    })
    client = object({
      next_public_api_url      = string
      next_public_api_key      = string
      next_public_arcgis_api_key = string
      next_public_webshot_url = string
      next_public_feature_partners = string
      basic_auth_enabled       = string
      basic_auth_user          = string
      basic_auth_password      = string
    })
  })
}

variable "staging" {
  type = object({
    aws_region = string
    api = object({
      auth_token      = string
      tiff_path       = string
      grid_tiles_path = string
    })
    client = object({
      next_public_api_url      = string
      next_public_api_key      = string
      next_public_arcgis_api_key = string
      next_public_webshot_url = string
      next_public_feature_partners = string
      basic_auth_enabled       = string
      basic_auth_user          = string
      basic_auth_password      = string
    })
  })
}

variable "prod" {
  type = object({
    aws_region = string
    api = object({
      auth_token      = string
      tiff_path       = string
      grid_tiles_path = string
    })
    client = object({
      next_public_api_url      = string
      next_public_api_key      = string
      next_public_arcgis_api_key = string
      next_public_webshot_url = string
      next_public_feature_partners = string
      basic_auth_enabled       = string
      basic_auth_user          = string
      basic_auth_password      = string
    })
  })
}