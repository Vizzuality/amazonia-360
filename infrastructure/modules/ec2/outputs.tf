output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.amazonia360-ec2.id
}