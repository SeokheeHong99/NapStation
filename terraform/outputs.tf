output "vercel_project_url" {
  description = "Production deployment URL"
  value       = "https://${vercel_project.napstation.name}.vercel.app"
}

output "neon_project_id" {
  description = "Neon project ID (useful for branching in CI)"
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
