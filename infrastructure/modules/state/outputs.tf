output "state_bucket_name" {
  value       = aws_s3_bucket.state.bucket
  description = "Name of the S3 bucket used to store the Terraform state"
}

output "lock_table_name" {
  value       = aws_dynamodb_table.lock.name
  description = "Name of the DynamoDB table used to lock the Terraform state"
}