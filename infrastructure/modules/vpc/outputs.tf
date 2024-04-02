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