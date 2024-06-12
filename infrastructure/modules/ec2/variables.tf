variable "ami" {
  type    = string
  description = "AMI ID for EC2 instance"
}

variable "instance_type" {
  type    = string
  description = "Instance type for EC2 instance"
  default     = "t2.micro"
}

variable "subnet_id" {
  type        = string
  description = "Subnet ID where the EC2 instance will be launched"
}

variable "instance_name" {
  type        = string
  description = "Name tag for the EC2 instance"
  default     = "amazonia360-ec2"
}

variable "security_group_ids" {
    type        = list(string)
    description = "List of security group Ids to attach to the EC2 instance"
}

variable "ec2_public_key" {
  type = string
  description = "Public key to be used for the key pair associated to the EC2 instance"
}


variable "authorized_key"{
    type = string
    description = "Public key to be added to the authorized_keys file of the ec2-user"
}

variable "environment" {
  type = string
  description = "Environment for the EC2 instance"
}