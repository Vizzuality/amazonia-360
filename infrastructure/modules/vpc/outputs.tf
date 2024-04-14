output "vpc_id" {
  value       = aws_vpc.amazonia360-vpc.id
  description = "The ID of the VPC"
}


output "subnet_id" {
  value       = aws_subnet.amazonia360-subnet.id
  description = "The ID of the subnet"
}

output "security_group_id" {
  value       = aws_security_group.amazonia360-sg.id
  description = "The ID of the security group"
}


output "acm_certificate_domain_validation_options" {
  description = "A list of attributes to feed into other resources to complete certificate validation. Can have more than one element, e.g. if SANs are defined. Only set if DNS-validation was used."
  value       = flatten(aws_acm_certificate.acm_certificate[*].domain_validation_options)
}

output "acm_certificate_arn" {
  description = "The ARN of the ACM certificate"
  value       = aws_acm_certificate.acm_certificate.arn
}