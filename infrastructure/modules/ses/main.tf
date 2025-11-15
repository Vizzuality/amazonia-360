resource "aws_ses_domain_identity" "main" {
  domain = var.ses_domain_name
  region = var.ses_aws_region
}

resource "aws_ses_domain_dkim" "main" {
  domain = aws_ses_domain_identity.main.domain
  region = var.ses_aws_region
}

resource "aws_ses_email_identity" "verified_emails" {
  for_each = toset(var.ses_verified_emails)
  email    = each.value
  region   = var.ses_aws_region
}
