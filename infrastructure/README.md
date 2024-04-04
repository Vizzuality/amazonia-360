### Amazonia 360 backend infrastructure

This terraform project creates the following resources:

- An EC2 instance with a public IP address
- A security group that allows SSH access to the EC2 instance
- A VPC
- A key pair associated to the EC2 instance

We are using for now the default profile in aws, which holds the credentials for the test user under de vizz backend sandbox. 
THis needs to be updated accordingly

By default, the vpc exposes the port 8000 to the internet, where the api will be running
Also, for now we will allow ssh access to the ec2 instance, but this should be removed in the future

For the ssh access to the EC2, a key pair is created, which the public key is injected from the variables.

To grant access to aditional users, a `user_data` block needs to be added to the ec2 instance adding the authorized keys for the users.

Sensitive data is stored in the `local.tfvars` file, which is not versioned. A copy of this file is available in the usual place for sensitive data.
The file `terraform.tfvars` is versioned and should only holds the definitions of the variables, not the values.