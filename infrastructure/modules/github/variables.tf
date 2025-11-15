variable "repo_name" {
  type = string
}

variable "global_secret_map" {
  type    = map(string)
  default = {}
}

variable "global_variable_map" {
  type    = map(string)
  default = {}
}

variable "environment_variable_map" {
  type    = map(string)
  default = {}
}

variable "environment_secret_map" {
  type    = map(string)
  default = {}
}

variable "github_owner" {
  type        = string
  description = "Owner of the Github repository where the code is hosted"
}

variable "github_token" {
  type        = string
  description = "Github token to access the repository"
}

variable "github_environment" {
  type        = string
  description = "Environment to create in the Github repository"
  default     = null
}
