output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "app_runner_service_url" {
  description = "App Runner service URL"
  value       = aws_apprunner_service.api.service_url
}

output "web_service_url" {
  description = "Frontend App Runner service URL"
  value       = aws_apprunner_service.web.service_url
}

output "ecr_repository_url" {
  description = "API ECR repository URL"
  value       = aws_ecr_repository.api.repository_url
}

output "web_ecr_repository_url" {
  description = "Web ECR repository URL"
  value       = aws_ecr_repository.web.repository_url
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}