output "domain_identity_arn" {
  description = "ARN of the SES domain identity"
  value       = aws_ses_domain_identity.main.arn
}

output "domain_identity_verification_token" {
  description = "Verification token for the SES domain identity (add this as a TXT record)"
  value       = aws_ses_domain_identity.main.verification_token
}

output "dkim_tokens" {
  description = "DKIM tokens for the domain (add these as CNAME records)"
  value       = aws_ses_domain_dkim.main.dkim_tokens
}

output "verified_email_identities" {
  description = "Map of verified email addresses"
  value       = { for k, v in aws_ses_email_identity.verified_emails : k => v.arn }
}

output "ses_dns_records" {
  description = "Complete DNS records needed for SES domain verification and DKIM (JSON format for automation)"
  value = {
    domain_verification = {
      type  = "TXT"
      name  = "_amazonses.${var.ses_domain_name}"
      value = aws_ses_domain_identity.main.verification_token
      ttl   = 1800
    }
    dkim_records = [
      for token in aws_ses_domain_dkim.main.dkim_tokens : {
        type  = "CNAME"
        name  = "${token}._domainkey.${var.ses_domain_name}"
        value = "${token}.dkim.amazonses.com"
        ttl   = 1800
      }
    ]
  }
}
