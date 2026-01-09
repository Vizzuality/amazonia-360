# Per-environment database configuration

resource "random_password" "db_password" {
  length  = 32
  special = false
}

locals {
  db_name     = "${var.project}-${var.environment}"
  db_username = "${var.project}_${var.environment}_user"
  db_password = random_password.db_password.result
}

output "db_name" {
  description = "Database name for this environment"
  value       = local.db_name
}

output "db_username" {
  description = "Database username for this environment"
  value       = local.db_username
}

output "db_password" {
  description = "Database password for this environment"
  value       = local.db_password
  sensitive   = true
}
