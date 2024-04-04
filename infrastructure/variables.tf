variable "region" {
  type    = string
  default = "eu-west-3"
}

variable "profile" {
  type    = string
  default = "default"
}

variable "ec2_public_key" {
  type = string
  description = "Public key to be used for the key pair associated to the EC2 instance"
}

variable "authorized_key" {
  type = string
  description = "Public key to be added to the authorized_keys file of the EC2 instance"
}