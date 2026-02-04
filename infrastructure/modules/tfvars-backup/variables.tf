variable "project_name" {
  type        = string
  description = "Project name, used for secret naming"
}

variable "tfvars_file_path" {
  type        = string
  description = "Absolute path to the tfvars file to back up"
}

variable "secret_name_suffix" {
  type        = string
  description = "Suffix for the secret name"
  default     = "terraform/local-tfvars"
}
