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
  name         = "NapStation"
  repository   = "https://github.com/${var.github_repo}"
  access_token = var.github_token
  platform     = "WEB_COMPUTE" # enables SSR / Next.js API routes

  build_spec = <<-EOT
    version: 1
    applications:
      - appRoot: NapStation
        frontend:
          phases:
            preBuild:
              commands:
                - npm install
                - npx prisma generate
                - node -e "const {createHash}=require('crypto');const p=process.env.ADMIN_PASSWORD||'';const t=createHash('sha256').update(p+'napstation-admin-v1').digest('hex');require('fs').writeFileSync('app/lib/admin.config.ts','import{createHash}from\"crypto\";const p=process.env.ADMIN_PASSWORD??\"\";export const ADMIN_TOKEN=\"'+t+'\";export const HAS_PASSWORD=true;');"
                - echo "DATABASE_URL=$DATABASE_URL" >> .env.production.local
                - echo "SUPABASE_URL=$SUPABASE_URL" >> .env.production.local
                - echo "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY" >> .env.production.local
            build:
              commands:
                - npm run build
          artifacts:
            baseDirectory: .next
            files:
              - '**/*'
          cache:
            paths:
              - node_modules/**/*
  EOT

  environment_variables = {
    DATABASE_URL                    = neon_project.napstation.connection_uri
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = var.google_maps_api_key
    SUPABASE_URL                    = var.supabase_url
    SUPABASE_SERVICE_ROLE_KEY       = var.supabase_service_role_key
    ADMIN_PASSWORD                  = var.admin_password
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
