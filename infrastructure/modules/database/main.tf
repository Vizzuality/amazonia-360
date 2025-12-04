terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.20"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

# Get the default VPC
data "aws_vpc" "vpc" {
  default = true
}

# Get all subnets in the VPC
data "aws_subnets" "vpc_subnets" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.vpc.id]
  }
}

# Get availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Create a DB subnet group
resource "aws_db_subnet_group" "database" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = data.aws_subnets.vpc_subnets.ids

  tags = {
    Name    = "${var.project_name}-db-subnet-group"
    Project = var.project_name
  }
}

# Create a security group for the RDS instance
resource "aws_security_group" "database" {
  name        = "${var.project_name}-rds-sg"
  description = "Security group for RDS PostgreSQL instance - ${var.project_name}"
  vpc_id      = data.aws_vpc.vpc.id

  # Allow PostgreSQL traffic from within the VPC
  ingress {
    description = "PostgreSQL from VPC"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.vpc.cidr_block]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project_name}-rds-sg"
    Project = var.project_name
  }
}

# Generate a random password for the master user
resource "random_password" "master_password" {
  length  = 32
  special = true
  # RDS password constraints
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Create the RDS PostgreSQL instance
resource "aws_db_instance" "database" {
  identifier     = "${var.project_name}-db"
  engine         = "postgres"
  engine_version = var.postgres_version

  instance_class    = var.instance_class
  allocated_storage = var.allocated_storage
  storage_type      = var.storage_type
  storage_encrypted = true

  db_name  = var.initial_db_name
  username = var.master_username
  password = random_password.master_password.result

  db_subnet_group_name   = aws_db_subnet_group.database.name
  vpc_security_group_ids = [aws_security_group.database.id]

  # Publicly accessible should be false for security
  publicly_accessible = false

  # Backup configuration
  backup_retention_period = var.backup_retention_period
  backup_window           = var.backup_window
  maintenance_window      = var.maintenance_window

  # Enable automated minor version upgrades
  auto_minor_version_upgrade = true

  # Deletion protection
  deletion_protection       = var.deletion_protection
  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.project_name}-db-final-snapshot"

  # Performance Insights
  performance_insights_enabled = var.performance_insights_enabled

  # Enhanced monitoring
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = {
    Name        = "${var.project_name}-db"
    Project     = var.project_name
    Environment = "shared"
  }
}
