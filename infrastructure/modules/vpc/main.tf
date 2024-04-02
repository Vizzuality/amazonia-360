resource "aws_vpc" "amazonia360-vpc" {
  cidr_block = var.vpc_cidr_block
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = var.vpc_name
  }
}


resource "aws_internet_gateway" "gw" {
 vpc_id = aws_vpc.amazonia360-vpc.id

 tags = {
   Name = "Project VPC IG"
 }
}

resource "aws_route_table_association" "public_subnet_asso" {
 count = 1
 subnet_id      = element(aws_subnet.amazonia360-subnet[*].id, count.index)
 route_table_id = aws_route_table.second_rt.id
}

resource "aws_route_table" "second_rt" {
 vpc_id = aws_vpc.amazonia360-vpc.id

 route {
   cidr_block = "0.0.0.0/0"
   gateway_id = aws_internet_gateway.gw.id
 }

 tags = {
   Name = "Project VPC Route Table"
 }
}


resource "aws_subnet" "amazonia360-subnet" {
  vpc_id            = aws_vpc.amazonia360-vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "eu-west-3a"

  tags = {
    Name = "amazonia360-subnet"
  }
}


resource "aws_security_group" "amazonia360-sg" {
  name        = "amazonia360-sg"
  description = "Security Group for amazonia360 EC2 instance"
  vpc_id      = aws_vpc.amazonia360-vpc.id

  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "amazonia360-sg"
  }
}
