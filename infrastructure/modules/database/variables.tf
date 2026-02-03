variable "project_name" {
  type        = string
  description = "Name of the project, used for resource naming"
}

variable "aws_region" {
  type        = string
  description = "AWS region where the database will be created"
}

variable "instance_class" {
  type        = string
  description = "The instance type of the RDS instance"
  default     = "db.t3.micro"
}

variable "allocated_storage" {
  type        = number
  description = "The allocated storage in gigabytes (minimum 100 for gp3)"
  default     = 100
}

variable "storage_type" {
  type        = string
  description = "One of 'standard' (magnetic), 'gp2' (general purpose SSD), 'gp3' (general purpose SSD), or 'io1' (provisioned IOPS SSD)"
  default     = "gp3"
}

variable "postgres_version" {
  type        = string
  description = "PostgreSQL version"
  default     = "18.1"
}

variable "initial_db_name" {
  type        = string
  description = "The name of the initial database to be created"
  default     = "postgres"
}

variable "master_username" {
  type        = string
  description = "Username for the master DB user"
  default     = "dbadmin"
}

variable "backup_retention_period" {
  type        = number
  description = "The days to retain backups for"
  default     = 7
}

variable "backup_window" {
  type        = string
  description = "The daily time range during which automated backups are created"
  default     = "03:00-04:00"
}

variable "maintenance_window" {
  type        = string
  description = "The window to perform maintenance in"
  default     = "sun:04:00-sun:05:00"
}

variable "deletion_protection" {
  type        = bool
  description = "If the DB instance should have deletion protection enabled"
  default     = true
}

variable "skip_final_snapshot" {
  type        = bool
  description = "Determines whether a final DB snapshot is created before the DB instance is deleted"
  default     = false
}

variable "performance_insights_enabled" {
  type        = bool
  description = "Specifies whether Performance Insights are enabled"
  default     = false
}
