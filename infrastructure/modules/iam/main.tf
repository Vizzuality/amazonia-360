# This user's access key & secret access key will be needed in GH Secrets
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
