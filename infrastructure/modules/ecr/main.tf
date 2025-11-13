locals {
  repository_name = "${var.project_name}-${var.repo_name}"
}

resource "aws_ecr_repository" "ecr_repository" {
  name                 = local.repository_name
  image_tag_mutability = var.image_mutability
  tags = {
    project = local.repository_name,
  }

  encryption_configuration {
    encryption_type = var.encrypt_type
  }
}

resource "aws_ecr_lifecycle_policy" "ecr_lifecycle_policy" {
  repository = aws_ecr_repository.ecr_repository.name
  policy     = <<EOF
{
    "rules": [
        {
            "rulePriority": 1,
            "description": "Keep production image",
            "selection": {
                "tagStatus": "tagged",
                "tagPrefixList": ["production"],
                "countType": "imageCountMoreThan",
                "countNumber": 1
            },
            "action": {
                "type": "expire"
            }
        },
        {
            "rulePriority": 2,
            "description": "Keep dev image",
            "selection": {
                "tagStatus": "tagged",
                "tagPrefixList": ["develop"],
                "countType": "imageCountMoreThan",
                "countNumber": 1
            },
            "action": {
                "type": "expire"
            }
        },
        {
            "rulePriority": 100,
            "description": "Delete older than n latest images",
            "selection": {
                "tagStatus": "any",
                "countType": "imageCountMoreThan",
                "countNumber": 3
            },
            "action": {
                "type": "expire"
            }
        }
    ]
}
EOF
}
