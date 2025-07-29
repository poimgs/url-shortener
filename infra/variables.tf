variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "github_repository" {
  description = "GitHub repository URL"
  type        = string
}

variable "production_domain" {
  description = "Production domain name"
  type        = string
  default     = "urlshort.example.com"
}

variable "staging_domain" {
  description = "Staging domain name"
  type        = string
  default     = "staging.urlshort.example.com"
}

# Environment-specific variables
variable "db_instance_class" {
  description = "RDS instance class by environment"
  type        = map(string)
  default = {
    staging    = "db.t3.micro"
    production = "db.t3.micro"
  }
}

variable "db_allocated_storage" {
  description = "RDS allocated storage by environment"
  type        = map(number)
  default = {
    staging    = 20
    production = 20
  }
}

variable "db_max_allocated_storage" {
  description = "RDS max allocated storage by environment"
  type        = map(number)
  default = {
    staging    = 50
    production = 50
  }
}

variable "db_backup_retention" {
  description = "RDS backup retention period by environment"
  type        = map(number)
  default = {
    staging    = 1
    production = 1
  }
}

variable "app_runner_cpu" {
  description = "App Runner CPU by environment"
  type        = map(string)
  default = {
    staging    = "0.25 vCPU"
    production = "0.25 vCPU"
  }
}

variable "app_runner_memory" {
  description = "App Runner memory by environment"
  type        = map(string)
  default = {
    staging    = "0.5 GB"
    production = "0.5 GB"
  }
}