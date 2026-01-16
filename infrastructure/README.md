# AmazoniaForever360+ Infrastructure

AmazoniaForever360+ is deployed in AWS's Elastic Beanstalk. All the resources are managed using **Terraform**.

## Terraform state

### Initializing terraform state

`terraform init` was executed with a local backend first.
```
terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}
```
After `terraform apply -var-file="vars/local.tfvars"` created all the resources needed for **remote** state, `terraform init -migrate-state` was executed to migrate the local state to **remote** state.
```
  // TF does not allow vars here. Use main vars or module outputs for other variables
  backend "s3" {
    profile = "amazonia360"
    bucket = "amazonia360-terraform-state"
    key = "terraform.tfstate"
    region = "eu-west-3"
    encrypt = true
    dynamodb_table = "amazonia360-terraform-state-lock"
  }
```
## PostgreSQL database for Payload CMS

The Tofu project provisions a single AWS RDS PostgreSQL database node, which is
then shared by all the application instances (dev/staging/production).

Each instance relies on a distinct PostgreSQL database on this RDS node; this is
provisioned automatically via an `ebextensions` script. In practice, this script
only effects changes the first time it is run successfully (for example, the
first time a new instance is created, once its Elastic Beanstalk environment is
deployed); however, since the script is idempotent, it is configured to run on
each deployment: on successive runs, it will detect that the relevant database
and credentials used to access it from Payload already exist, and will quietly
quit without further action.

## Domain Aliases

Each environment module (`modules/env`) supports an optional `domain_aliases`
variable that allows to configure additional domain names that redirect to the
main domain.

### Usage

To add domain aliases to an environment, add the `domain_aliases` parameter when
instantiating the `env` module:

```hcl
module "prod" {
  source = "./modules/env"

  domain         = "amazoniaforever360.org"
  domain_aliases = [
    "www.amazoniaforever360.org",
    "amazonia360.org",
    "www.amazonia360.org"
  ]

  # ... other configuration ...
}
```

### How it works

1. **ACM Certificates**: Each domain alias gets its own ACM certificate created
   and validated via DNS

2. **Load Balancer Configuration**: All certificates (main domain + aliases) are
   attached to the HTTPS listener (port 443) for the relevant Elastic Beanstalk
   environment

3. **Permanent Redirects**: Any requests to domain aliases are automatically
   redirected (HTTP 301) to the same path/params on the main domain

For example, if the main domain is `amazoniaforever360.org` and you add
`beta.amazoniaforever360.org` as an alias:
`https://beta.amazoniaforever360.org/some/path?param=value` → redirects to
`https://amazoniaforever360.org/some/path?param=value`

### DNS Configuration

After adding domain aliases:

1. Create DNS validation records for each alias certificate (check Tofu
   outputs)

2. Point each alias domain's DNS A/CNAME record to the load balancer hostname

### Outputs

The module provides the following outputs for domain aliases:

- `acm_certificate_aliases_domain_validation_options`: DNS validation records
  needed for each alias certificate

- `acm_certificate_aliases_arns`: Map of domain aliases to their ACM certificate
  ARNs

## Amazon SES

Transactional emails for user management-related workflows (email verification,
password reset/recovery...) in Payload are sent via Amazon SES.

The SES setup is managed via OpenTofu, with a simple architecture:

- SES identities are created in a single AWS region and shared across all the
  live environments (production, staging, dev); the setup can also be used from
  local development environments.

- Each live environment gets its own IAM user for SES, for better isolation and
  easier credential rotation

- Credentials are made available to the containers that run the client service
  via environment variables injected through the Docker Compose configuration
  deployed to the relevant Elastic Beanstalk environments (AWS access key ID and
  secret access key, alongside the AWS region where the SES identities are
  defined)

### Initial setup

Once configured (sending domain and AWS zone), the SES setup needs some manual actions:

- domain and identity verification via DNS records (all the relevant records are
  shown in the OpenTofu outputs when applying the Tofu configuration)

- requesting production access (e.g. via the AWS web console)
