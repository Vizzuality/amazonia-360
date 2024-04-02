### Amazonia 360 backend infrastructure

This terraform project creates the following resources:

- An EC2 instance with a public IP address
- A security group that allows SSH access to the EC2 instance
- A VPC

We are using for now the default profile in aws, which holds the credentials for the test user under de vizz backend sandbox. 
THis needs to be updated accordingly

By default, the vpc exposes the port 8000 to the internet, where the api will be running
Also, for now we will allow ssh access to the ec2 instance, but this should be removed in the future

For the ssh access to the EC2, the key pair is created given the local public key in the file `~/.ssh/id_rsa.pub`. This should be updated to the correct key pair in the future