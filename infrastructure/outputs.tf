# SES Outputs - Project-level configuration

output "ses_region" {
  description = "AWS region where SES is configured"
  value       = var.ses_aws_region
}

output "ses_domain_name" {
  description = "Domain name configured for SES"
  value       = var.ses_domain_name
}

output "ses_domain_identity_arn" {
  description = "ARN of the SES domain identity"
  value       = module.ses.domain_identity_arn
}

output "ses_domain_verification_token" {
  description = "Verification token for the SES domain identity (add this as a TXT record)"
  value       = module.ses.domain_identity_verification_token
}

output "ses_dkim_tokens" {
  description = "DKIM tokens for the domain (add these as CNAME records)"
  value       = module.ses.dkim_tokens
}

output "ses_verified_email_identities" {
  description = "Map of verified email addresses"
  value       = module.ses.verified_email_identities
}

# DNS Records - Formatted for easy copy-paste

output "ses_dns_records" {
  description = "Complete DNS records needed for SES domain verification and DKIM (JSON format for automation)"
  value       = module.ses.ses_dns_records
}

# Per-Environment IAM User Credentials

## Dev Environment
#
# These are added to outputs for convenience, as the credentials for the dev
# environment may also be used in local development environments. Be mindful of
# the use of these credentials, in any case, as these credentials are not scoped
# in any restricted way, so they are as sensitive as the staging and production
# ones: different IAM users for these environments are set up only to provide
# easier rotation, not to partition security scopes.
output "ses_dev_iam_user_name" {
  description = "IAM username for SES access in dev environment"
  value       = module.dev.ses_iam_user_name
}

output "ses_dev_iam_user_access_key_id" {
  description = "Access key ID for SES IAM user in dev environment"
  value       = module.dev.ses_iam_user_access_key_id
  sensitive   = true
}

output "ses_dev_iam_user_secret_access_key" {
  description = "Secret access key for SES IAM user in dev environment"
  value       = module.dev.ses_iam_user_secret_access_key
  sensitive   = true
}

# Database outputs
output "database_endpoint" {
  description = "The connection endpoint for the shared database"
  value       = module.database.db_instance_endpoint
}

output "database_address" {
  description = "The hostname of the shared database"
  value       = module.database.db_instance_address
}

output "database_port" {
  description = "The port of the shared database"
  value       = module.database.db_instance_port
}

output "database_name" {
  description = "The name of the initial database"
  value       = module.database.db_instance_name
}

output "db_admin_username" {
  description = "The admin username for the shared database"
  value       = module.database.db_admin_username
}

output "db_admin_password" {
  description = "The admin user's password for the shared database"
  value       = module.database.db_admin_password
  sensitive   = true
}

# tfvars backup outputs
output "tfvars_backup_secret_arn" {
  description = "ARN of the Secrets Manager secret storing local.tfvars backup"
  value       = module.tfvars_backup.secret_arn
}

output "tfvars_backup_secret_name" {
  description = "Name of the Secrets Manager secret storing local.tfvars backup"
  value       = module.tfvars_backup.secret_name
}

output "tfvars_backup_content_hash" {
  description = "SHA256 hash of the current local.tfvars content"
  value       = module.tfvars_backup.content_hash
}
