# ─────────────────────────────────────────────
# Neon PostgreSQL
# ─────────────────────────────────────────────

resource "neon_project" "napstation" {
  name                      = "napstation"
  region_id                 = "aws-us-east-2"
  org_id                    = "org-wandering-fog-91274707"
  history_retention_seconds = 21600
}

resource "neon_database" "app" {
  project_id = neon_project.napstation.id
  branch_id  = neon_project.napstation.default_branch_id
  name       = "napstation"
  owner_name = neon_project.napstation.database_user
}

# ─────────────────────────────────────────────
# AWS Amplify
# ─────────────────────────────────────────────

resource "aws_amplify_app" "napstation" {
  name         = "napstation"
  repository   = "https://github.com/${var.github_repo}"
  access_token = var.github_token
  platform     = "WEB_COMPUTE" # enables SSR / Next.js API routes

  build_spec = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - cd NapStation
            - npm install
            - npx prisma generate
        build:
          commands:
            - cd NapStation
            - npm run build
      artifacts:
        baseDirectory: NapStation/.next
        files:
          - '**/*'
      cache:
        paths:
          - NapStation/node_modules/**/*
  EOT

  environment_variables = {
    DATABASE_URL                    = neon_project.napstation.connection_uri
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = var.google_maps_api_key
    SUPABASE_URL                    = var.supabase_url
    SUPABASE_SERVICE_ROLE_KEY       = var.supabase_service_role_key
    AMPLIFY_MONOREPO_APP_ROOT       = "NapStation"
    _LIVE_UPDATES                   = "[{\"name\":\"Next.js version\",\"pkg\":\"next-version\",\"type\":\"internal\",\"version\":\"latest\"}]"
  }
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.napstation.id
  branch_name = "main"
  framework   = "Next.js - SSR"
  stage       = "PRODUCTION"

  enable_auto_build = true
}
