
output "beanstalk_environment_settings" {
  value = module.beanstalk.environment_settings
}

output "beanstalk_environment_cname" {
  value = module.beanstalk.environment_cname
}

output "acm_certificate_domain_validation_options" {
  description = "A list of attributes to feed into other resources to complete certificate validation. Can have more than one element, e.g. if SANs are defined. Only set if DNS-validation was used."
  value       = flatten(aws_acm_certificate.acm_certificate[*].domain_validation_options)
}

output "acm_certificate_arn" {
  description = "The ARN of the ACM certificate"
  value       = aws_acm_certificate.acm_certificate.arn
}

output "acm_certificate_validation_id" {
  description = "The ID of the certificate validation resource"
  value       = aws_acm_certificate_validation.domain_certificate_validation.id
}

output "acm_certificate_aliases_domain_validation_options" {
  description = "A list of attributes to feed into other resources to complete certificate validation for domain aliases"
  value       = { for domain, cert in aws_acm_certificate.acm_certificate_aliases : domain => cert.domain_validation_options }
}

output "acm_certificate_aliases_arns" {
  description = "Map of domain aliases to their ACM certificate ARNs"
  value       = { for domain, cert in aws_acm_certificate.acm_certificate_aliases : domain => cert.arn }
}

output "acm_certificate_alias_validations" {
  description = "Map of domain aliases to their certificate validation resource IDs"
  value       = { for domain, validation in aws_acm_certificate_validation.alias_certificate_validation : domain => validation.id }
}
