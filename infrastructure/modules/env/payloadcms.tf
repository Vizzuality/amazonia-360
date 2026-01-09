# Per-environment PayloadCMS secrets and keys

resource "random_password" "payload_api_key" {
  length  = 32
  special = true
}

resource "random_password" "payload_secret" {
  length  = 32
  special = true
}

resource "random_password" "auth_secret" {
  length  = 32
  special = true
}

output "payload_secret" {
  description = "The Payload secret for this instance"
  value       = random_password.payload_secret.result
  sensitive   = true
}

output "payload_api_key" {
  description = "The Payload API key for this instance"
  value       = random_password.payload_api_key.result
  sensitive   = true
}

output "payload_auth_secret" {
  description = "Auth secret for this instance"
  value       = random_password.auth_secret.result
  sensitive   = true
}
