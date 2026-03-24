output "amplify_app_url" {
  description = "Production deployment URL"
  value       = "https://main.${aws_amplify_app.napstation.default_domain}"
}

output "amplify_app_id" {
  description = "Amplify app ID"
  value       = aws_amplify_app.napstation.id
}

output "neon_project_id" {
  description = "Neon project ID"
  value       = neon_project.napstation.id
}

output "neon_connection_uri" {
  description = "Database connection string"
  value       = neon_project.napstation.connection_uri
  sensitive   = true
}

output "neon_dashboard_url" {
  description = "Neon console link"
  value       = "https://console.neon.tech/app/projects/${neon_project.napstation.id}"
}
