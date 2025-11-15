# SES Quick Tests

This guide shows how to test SES email sending before integrating SES with an
Amazonia360 application instance/environment.

## Prerequisites

- Terraform/OpenTofu installed
- AWS CLI installed

The Tofu configuration for the platform's SES environment should have been
applied already, so that per-environment IAM credentials are available and
operational.

## How to test email sending

```bash
cd infrastructure

# Export credentials for testing
export AWS_SES_REGION=$(tofu output -raw ses_region)
export AWS_ACCESS_KEY_ID=$(tofu output -raw ses_dev_iam_user_access_key_id)
export AWS_SECRET_ACCESS_KEY=$(tofu output -raw ses_dev_iam_user_secret_access_key)


## Step 3: Send Test Email

### Method 1: Using AWS CLI (Easiest) ⭐

```bash
aws ses send-email \
  --region $AWS_SES_REGION \
  --from "notifications@amazoniaforever360.org" \
  --to "a-verified-email-sender@example.com" \
  --subject "SES Test" \
  --text "This is a test email sent sent via AWS SES"
```

If the operation is successful, a response similar to the following one should
be displayed:

```json
{
    "MessageId": "0100018c7e8a9b2d-12345678-abcd-..."
}
```

## Notes

SES starts in **sandbox mode** by default.

In sandbox mode:

- Emails can be sent to **verified email addresses only**

Email address verification can be done by adding a valid email address to the
`ses_verified_emails` global Tofu variable and applying the Tofu configuration.
Verification emails will be sent to any new email addresses in the list, and the
recipient needs to click through the link in the verification email to complete
the verification process.

Verified emails can be seen in the AWS SES console under Configuration >
Identities, or can be listed using the AWS CLI.

- Email sending quotas apply (by default 200 emails per 24-hour period, 1 email
  per second)
