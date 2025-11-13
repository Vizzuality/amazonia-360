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

## Staging Environment
output "ses_staging_iam_user_name" {
  description = "IAM username for SES access in staging environment"
  value       = module.staging.ses_iam_user_name
}

output "ses_staging_iam_user_access_key_id" {
  description = "Access key ID for SES IAM user in staging environment"
  value       = module.staging.ses_iam_user_access_key_id
  sensitive   = true
}

output "ses_staging_iam_user_secret_access_key" {
  description = "Secret access key for SES IAM user in staging environment"
  value       = module.staging.ses_iam_user_secret_access_key
  sensitive   = true
}

## Production Environment
output "ses_prod_iam_user_name" {
  description = "IAM username for SES access in production environment"
  value       = module.prod.ses_iam_user_name
}

output "ses_prod_iam_user_access_key_id" {
  description = "Access key ID for SES IAM user in production environment"
  value       = module.prod.ses_iam_user_access_key_id
  sensitive   = true
}

output "ses_prod_iam_user_secret_access_key" {
  description = "Secret access key for SES IAM user in production environment"
  value       = module.prod.ses_iam_user_secret_access_key
  sensitive   = true
}
