
variable "ses_aws_region" {
  type        = string
  description = "AWS region for SES service (used across all environments)"
}

variable "ses_domain_name" {
  type        = string
  description = "Domain name to verify with SES"
}

variable "ses_verified_emails" {
  type        = list(string)
  description = "List of email addresses to verify with SES"
  default     = []
}
