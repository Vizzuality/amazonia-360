variable "vpc_cidr_block" {
  type        = string
  description = "CIDR block for the VPC"
  default     = "10.0.0.0/16"
}

variable "vpc_name" {
  type        = string
  description = "Name of the VPC"
  default     = "amazonia360-vpc"
}

variable "ec2_instance_id"{
    type = string
    description = "ID of the EC2 instance"
}