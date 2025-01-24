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

# resource "aws_acm_certificate_validation" "domain_certificate_validation" {
#   certificate_arn = aws_acm_certificate.acm_certificate.arn
# }
