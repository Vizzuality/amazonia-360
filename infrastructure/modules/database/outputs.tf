output "db_instance_id" {
  description = "The RDS instance ID"
  value       = aws_db_instance.database.id
}

output "db_instance_arn" {
  description = "The ARN of the RDS instance"
  value       = aws_db_instance.database.arn
}

output "db_instance_endpoint" {
  description = "The connection endpoint in address:port format"
  value       = aws_db_instance.database.endpoint
}

output "db_instance_address" {
  description = "The hostname of the RDS instance"
  value       = aws_db_instance.database.address
}

output "db_instance_port" {
  description = "The database port"
  value       = aws_db_instance.database.port
}

output "db_instance_name" {
  description = "The database name"
  value       = aws_db_instance.database.db_name
}

output "db_master_username" {
  description = "The master username for the database"
  value       = aws_db_instance.database.username
  sensitive   = true
}

output "db_master_password" {
  description = "The master password for the database"
  value       = random_password.master_password.result
  sensitive   = true
}

output "db_security_group_id" {
  description = "The ID of the database security group"
  value       = aws_security_group.database.id
}

output "db_subnet_group_name" {
  description = "The name of the database subnet group"
  value       = aws_db_subnet_group.database.name
}
