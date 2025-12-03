# IAM user for CI/CD pipeline

## This user's access key & secret access key will be needed in GH Secrets
resource "aws_iam_user" "pipeline_user" {
  name = "ProjectPipelineUser"
}

resource "aws_iam_access_key" "pipeline_user_access_key" {
  user = aws_iam_user.pipeline_user.name
}

resource "aws_iam_user_policy_attachment" "eb_web_tier_user_policy" {
  user       = aws_iam_user.pipeline_user.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier"
}

resource "aws_iam_user_policy_attachment" "eb_managed_updates_customer_user_policy" {
  user       = aws_iam_user.pipeline_user.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkManagedUpdatesCustomerRolePolicy"
}

## Below policies are needed to login through GitHub Actions

resource "aws_iam_user_policy" "get_ecr_token_policy" {
  name = "get_ecr_token_policy"
  user = aws_iam_user.pipeline_user.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
    ]
  })
}

resource "aws_iam_user_policy" "ecr_push_pull_policy" {
  name = "ecr_push_pull_policy"
  user = aws_iam_user.pipeline_user.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability",
          "ecr:CompleteLayerUpload",
          "ecr:GetDownloadUrlForLayer",
          "ecr:InitiateLayerUpload",
          "ecr:PutImage",
          "ecr:UploadLayerPart"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
    ]
  })
}

# IAM user for s3 syncs

## This user's access key & secret access key will be needed in GH Secrets
resource "aws_iam_user" "s3_syncs_user" {
  name = "ProjectS3SyncsUser"
}

resource "aws_iam_access_key" "s3_syncs_user_access_key" {
  user = aws_iam_user.s3_syncs_user.name
}

resource "aws_iam_policy" "s3_syncs_policy" {
  name        = "${var.project}-s3-syncs-policy"
  description = "Policy for S3 syncs user to read and write across project buckets"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:ListBucket"
        ],
        Resource = "arn:aws:s3:::${var.project}-*-bucket"
      },
      {
        Effect = "Allow",
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ],
        Resource = "arn:aws:s3:::${var.project}-*-bucket/*"
      }
    ]
  })
}

resource "aws_iam_user_policy_attachment" "s3_syncs_user_policy" {
  user       = aws_iam_user.s3_syncs_user.name
  policy_arn = aws_iam_policy.s3_syncs_policy.arn
}
