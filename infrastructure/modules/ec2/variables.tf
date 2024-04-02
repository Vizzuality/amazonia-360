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

variable "security_groups" {
    type        = list(string)
    description = "List of security groups to attach to the EC2 instance"
}
