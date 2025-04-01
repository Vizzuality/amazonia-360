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
