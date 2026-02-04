output "secret_arn" {
  value       = aws_secretsmanager_secret.tfvars.arn
  description = "ARN of the Secrets Manager secret storing tfvars"
}

output "secret_name" {
  value       = aws_secretsmanager_secret.tfvars.name
  description = "Name of the Secrets Manager secret"
}

output "content_hash" {
  value       = local.content_hash
  description = "SHA256 hash of the current local.tfvars content"
}

output "current_git_commit" {
  value       = data.external.git_info.result.commit
  description = "Git commit hash at the time of the last apply"
}
