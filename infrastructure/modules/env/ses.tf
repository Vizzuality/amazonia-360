# IAM user for SES access (per environment)
resource "aws_iam_user" "ses_user" {
  name = "${var.project}-${var.environment}-ses-user"
  path = "/ses/"

  tags = {
    Project     = var.project
    Environment = var.environment
    Purpose     = "SES Email Sending"
  }
}

resource "aws_iam_access_key" "ses_user" {
  user = aws_iam_user.ses_user.name
}

resource "aws_iam_user_policy" "ses_user_policy" {
  name = "${var.project}-${var.environment}-ses-policy"
  user = aws_iam_user.ses_user.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail",
          "ses:SendTemplatedEmail",
          "ses:SendBulkTemplatedEmail"
        ]
        Resource = "*"
      }
    ]
  })
}
