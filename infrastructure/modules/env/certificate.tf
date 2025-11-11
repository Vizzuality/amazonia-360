#
# DNS Management
#

# Request and validate an SSL certificate from AWS Certificate Manager (ACM)
resource "aws_acm_certificate" "acm_certificate" {
  domain_name       = var.domain
  validation_method = "DNS"

  tags = {
    Name = "${var.domain} SSL certificate"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate_validation" "domain_certificate_validation" {
  certificate_arn = aws_acm_certificate.acm_certificate.arn

  lifecycle {
    create_before_destroy = true
  }
}

# Create ACM certificates for each domain alias
resource "aws_acm_certificate" "acm_certificate_aliases" {
  for_each = toset(var.domain_aliases)

  domain_name       = each.value
  validation_method = "DNS"

  tags = {
    Name = "${each.value} SSL certificate - alias for ${var.domain}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Validate domain alias certificates
resource "aws_acm_certificate_validation" "alias_certificate_validation" {
  for_each = aws_acm_certificate.acm_certificate_aliases

  certificate_arn = each.value.arn

  lifecycle {
    create_before_destroy = true
  }
}
