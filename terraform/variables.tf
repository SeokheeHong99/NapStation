# Vercel
variable "vercel_api_token" {
  description = "Vercel API token (from vercel.com/account/tokens)"
  type        = string
  sensitive   = true
}

variable "vercel_team_id" {
  description = "Vercel team ID — leave empty for personal account"
  type        = string
  default     = null
}

variable "github_repo" {
  description = "GitHub repo in 'owner/repo-name' format (e.g. 'seokheehong/napstation')"
  type        = string
}

# Neon
variable "neon_api_key" {
  description = "Neon API key (from console.neon.tech/app/settings/api-keys)"
  type        = string
  sensitive   = true
}

# Google Maps
variable "google_maps_api_key" {
  description = "Google Maps JavaScript API key"
  type        = string
  sensitive   = true
}

# Supabase (managed separately — set these from your Supabase dashboard)
variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
}

variable "supabase_service_role_key" {
  description = "Supabase service role key"
  type        = string
  sensitive   = true
}
