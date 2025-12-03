output "pipeline_user_arn" {
  description = "The Amazon Resource Name (ARN) assigned to the pipeline user"
  value       = try(aws_iam_user.pipeline_user.arn, "")
}

output "pipeline_user_access_key_id" {
  description = "The access key id for the pipeline user"
  value       = try(aws_iam_access_key.pipeline_user_access_key.id, "")
}

output "pipeline_user_secret_access_key" {
  description = "The secret access key for the pipeline user"
  value       = try(aws_iam_access_key.pipeline_user_access_key.secret, "")
}

output "s3_syncs_user_access_key_id" {
  description = "The access key id for the s3_syncs user"
  value       = try(aws_iam_access_key.s3_syncs_user_access_key.id, "")
}

output "s3_syncs_user_secret_access_key" {
  description = "The secret access key for the s3_syncs user"
  value       = try(aws_iam_access_key.s3_syncs_user_access_key.secret, "")
}
