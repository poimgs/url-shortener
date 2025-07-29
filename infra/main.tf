terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  environment = terraform.workspace
  name_prefix = "url-shortener-${local.environment}"
  
  common_tags = {
    Environment = local.environment
    Project     = "url-shortener"
    ManagedBy   = "terraform"
  }
}

# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

resource "aws_subnet" "public" {
  count = length(var.availability_zones)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-${count.index + 1}"
    Type = "public"
  })
}

resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-${count.index + 1}"
    Type = "private"
  })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Security Groups
resource "aws_security_group" "rds" {
  name_prefix = "${local.name_prefix}-rds-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_runner.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-sg"
  })
}

resource "aws_security_group" "app_runner" {
  name_prefix = "${local.name_prefix}-app-runner-"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-runner-sg"
  })
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "${local.name_prefix}-db"

  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class[local.environment]

  allocated_storage     = var.db_allocated_storage[local.environment]
  max_allocated_storage = var.db_max_allocated_storage[local.environment]
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "url_shortener"
  username = "postgres"
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = var.db_backup_retention[local.environment]
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"

  skip_final_snapshot       = local.environment == "staging"
  final_snapshot_identifier = local.environment == "production" ? "${local.name_prefix}-final-snapshot" : null

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db"
  })
}

# ECR Repository
resource "aws_ecr_repository" "api" {
  name                 = "${local.name_prefix}-api"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = local.common_tags
}

# App Runner VPC Connector
resource "aws_apprunner_vpc_connector" "main" {
  vpc_connector_name = "${local.name_prefix}-vpc-connector"
  subnets            = aws_subnet.private[*].id
  security_groups    = [aws_security_group.app_runner.id]

  tags = local.common_tags
}

# App Runner Service
resource "aws_apprunner_service" "api" {
  service_name = "${local.name_prefix}-api"

  source_configuration {
    image_repository {
      image_configuration {
        port = "4000"
        runtime_environment_variables = {
          NODE_ENV     = "production"
          DATABASE_URL = "postgresql://${aws_db_instance.main.username}:${var.db_password}@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"
          FRONTEND_URL = local.environment == "production" ? "https://${var.production_domain}" : "https://${var.staging_domain}"
        }
      }
      image_identifier                = "${aws_ecr_repository.api.repository_url}:latest"
      image_repository_type           = "ECR"
    }
    auto_deployments_enabled = false
  }

  network_configuration {
    egress_configuration {
      egress_type       = "VPC"
      vpc_connector_arn = aws_apprunner_vpc_connector.main.arn
    }
  }

  instance_configuration {
    cpu    = var.app_runner_cpu[local.environment]
    memory = var.app_runner_memory[local.environment]
  }

  health_check_configuration {
    healthy_threshold   = 1
    interval            = 10
    path                = "/health"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 5
  }

  tags = local.common_tags
}

# Amplify App for Frontend
resource "aws_amplify_app" "web" {
  name       = "${local.name_prefix}-web"
  repository = var.github_repository

  build_spec = file("${path.module}/amplify.yml")

  environment_variables = {
    NEXT_PUBLIC_API_URL = aws_apprunner_service.api.service_url
    NODE_ENV           = "production"
  }

  custom_rule {
    source = "/<*>"
    status = "404-200"
    target = "/index.html"
  }

  tags = local.common_tags
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.web.id
  branch_name = local.environment == "production" ? "main" : "develop"

  environment_variables = {
    NEXT_PUBLIC_API_URL = aws_apprunner_service.api.service_url
  }
}

resource "aws_amplify_domain_association" "main" {
  count = local.environment == "production" ? 1 : 0

  app_id      = aws_amplify_app.web.id
  domain_name = var.production_domain

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = ""
  }
}