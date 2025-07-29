output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "app_runner_service_url" {
  description = "App Runner service URL"
  value       = aws_apprunner_service.api.service_url
}

output "amplify_app_id" {
  description = "Amplify app ID"
  value       = aws_amplify_app.web.id
}

output "amplify_default_domain" {
  description = "Amplify default domain"
  value       = aws_amplify_app.web.default_domain
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.api.repository_url
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