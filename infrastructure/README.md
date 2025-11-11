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
