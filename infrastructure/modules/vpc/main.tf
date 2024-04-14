terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.10.0"
    }
    acme = {
      source  = "vancluever/acme"
      version = "~> 2.5.0"
    }

  }
}

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
  count          = 2
  subnet_id      = count.index == 0 ? aws_subnet.amazonia360-subnet.id : aws_subnet.amazonia360-subnet2.id
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

resource "aws_subnet" "amazonia360-subnet2" {
  vpc_id            = aws_vpc.amazonia360-vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "eu-west-3b"
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
    from_port   = 443
    to_port     = 443
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


resource "aws_eip" "amazonia360-eip" {
  instance = var.ec2_instance_id
  domain      = "vpc"
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_lb" "load_balancer" {
  name               = "amazonia360-load-balancer"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.amazonia360-sg.id]
  subnets            = [aws_subnet.amazonia360-subnet.id, aws_subnet.amazonia360-subnet2.id]

  enable_deletion_protection = false
}



resource "aws_lb_target_group" "my_target_group" {
  name     = "my-target-group"
  port     = 8000
  protocol = "HTTP"
  vpc_id   = aws_vpc.amazonia360-vpc.id

  health_check {
    enabled = true
    path    = "/health"
    protocol = "HTTP"
  }
}


resource "aws_lb_target_group_attachment" "my_target_group_attachment" {
  target_group_arn = aws_lb_target_group.my_target_group.arn
  target_id        = var.ec2_instance_id
  port             = 8000
}


resource "aws_lb_listener" "https_listener" {
  load_balancer_arn = aws_lb.load_balancer.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = aws_acm_certificate.acm_certificate.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.my_target_group.arn
  }
}



## Certificate

resource "aws_acm_certificate" "acm_certificate" {
  domain_name       = "api.amazonia360.dev-vizzuality.com"
  validation_method = "DNS"

  tags = {
    Name = "Amazonia360 API SSL certificate"
  }

  lifecycle {
    create_before_destroy = true
  }
}

#
# resource "aws_acm_certificate_validation" "domain_certificate_validation" {
#   certificate_arn = aws_acm_certificate.acm_certificate.arn
# }
