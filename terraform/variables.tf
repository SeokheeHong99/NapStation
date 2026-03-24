# AWS
variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "aws_access_key" {
  description = "AWS access key ID"
  type        = string
  sensitive   = true
}

variable "aws_secret_key" {
  description = "AWS secret access key"
  type        = string
  sensitive   = true
}

variable "github_token" {
  description = "GitHub personal access token with 'repo' scope (github.com/settings/tokens)"
  type        = string
  sensitive   = true
}

variable "github_repo" {
  description = "GitHub repo in 'owner/repo-name' format"
  type        = string
}

# Neon
variable "neon_api_key" {
  description = "Neon API key (console.neon.tech → Settings → API Keys)"
  type        = string
  sensitive   = true
}

# Google Maps
variable "google_maps_api_key" {
  description = "Google Maps JavaScript API key"
  type        = string
  sensitive   = true
}

# Supabase
variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
}

variable "supabase_service_role_key" {
  description = "Supabase service role key"
  type        = string
  sensitive   = true
}
