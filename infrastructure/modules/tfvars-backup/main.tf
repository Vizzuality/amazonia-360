locals {
  tfvars_content = file(var.tfvars_file_path)
  content_hash   = sha256(local.tfvars_content)
}

data "external" "git_info" {
  program = ["bash", "-c", <<-EOT
    COMMIT=$(git -C "${path.root}" rev-parse HEAD 2>/dev/null || echo "unknown")
    echo "{\"commit\":\"$COMMIT\"}"
  EOT
  ]
}

resource "aws_secretsmanager_secret" "tfvars" {
  name        = "${var.project_name}/${var.secret_name_suffix}"
  description = "Backup of local.tfvars Terraform configuration. This stores the tfvars used during terraform apply to prevent configuration drift."

  recovery_window_in_days = 0
}


resource "aws_secretsmanager_secret_version" "tfvars" {
  secret_id = aws_secretsmanager_secret.tfvars.id
  secret_string = jsonencode({
    content      = local.tfvars_content
    content_hash = local.content_hash
    git_commit   = data.external.git_info.result.commit
  })
}
