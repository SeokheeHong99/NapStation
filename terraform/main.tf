# ─────────────────────────────────────────────
# Neon PostgreSQL
# ─────────────────────────────────────────────

resource "neon_project" "napstation" {
  name      = "napstation"
  region_id = "aws-us-east-2"
}

resource "neon_database" "app" {
  project_id = neon_project.napstation.id
  branch_id  = neon_project.napstation.default_branch_id
  name       = "napstation"
  owner_name = neon_project.napstation.database_user
}

# ─────────────────────────────────────────────
# Vercel Project
# ─────────────────────────────────────────────

resource "vercel_project" "napstation" {
  name      = "napstation"
  framework = "nextjs"

  git_repository = {
    type = "github"
    repo = var.github_repo
  }

  # Automatically deploy on push to main
  build_command    = "npx prisma generate && npm run build"
  root_directory   = null
  serverless_function_region = "iad1" # us-east-1 — closest to Neon aws-us-east-2
}

# ─────────────────────────────────────────────
# Vercel Environment Variables
# ─────────────────────────────────────────────

resource "vercel_project_environment_variable" "database_url" {
  project_id = vercel_project.napstation.id
  key        = "DATABASE_URL"
  value      = neon_project.napstation.connection_uri
  targets    = ["production", "preview", "development"]
}

resource "vercel_project_environment_variable" "google_maps_key" {
  project_id = vercel_project.napstation.id
  key        = "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"
  value      = var.google_maps_api_key
  targets    = ["production", "preview", "development"]
}

resource "vercel_project_environment_variable" "supabase_url" {
  project_id = vercel_project.napstation.id
  key        = "SUPABASE_URL"
  value      = var.supabase_url
  targets    = ["production", "preview", "development"]
}

resource "vercel_project_environment_variable" "supabase_service_role_key" {
  project_id = vercel_project.napstation.id
  key        = "SUPABASE_SERVICE_ROLE_KEY"
  value      = var.supabase_service_role_key
  targets    = ["production", "preview", "development"]
}
