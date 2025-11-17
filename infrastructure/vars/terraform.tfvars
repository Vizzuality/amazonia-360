aws_profile        = "amazonia360"
allowed_account_id = "851725508245"
project_name       = "amazonia360"
repo_name          = "amazonia-360"
github_owner       = "Vizzuality"
github_token       = ""

# SES configuration, using a single setup for all environments
ses_domain_name = "amazoniaforever360.org"
ses_aws_region  = "sa-east-1"

# Database configuration (shared RDS instance for all environments) Configurable
# RDS SKU - adjust based on workload requirements; a small-ish instance should
# be ok for most real-world use cases
database_instance_class          = "db.t3.medium"
database_allocated_storage       = 50
database_backup_retention_period = 14

dev = {
  aws_region = "sa-east-1"

  api = {
    auth_token      = ""
    openai_token    = ""
    tiff_path       = "/opt/api/data"
    grid_tiles_path = "/opt/api/data/grid"
  }

  client = {
    next_public_api_url          = ""
    next_public_api_key          = ""
    next_public_webshot_url      = ""
    next_public_arcgis_api_key   = ""
    basic_auth_enabled           = ""
    basic_auth_user              = ""
    basic_auth_password          = ""
    payload_secret               = ""
    database_url                 = ""
    app_key                      = ""
    auth_secret                  = ""
  }
}

staging = {
  aws_region = "sa-east-1"

  api = {
    auth_token      = ""
    openai_token    = ""
    tiff_path       = "/opt/api/data"
    grid_tiles_path = "/opt/api/data/grid"
  }

  client = {
    next_public_api_url          = ""
    next_public_api_key          = ""
    next_public_webshot_url      = ""
    next_public_arcgis_api_key   = ""
    basic_auth_enabled           = ""
    basic_auth_user              = ""
    basic_auth_password          = ""
    payload_secret               = ""
    database_url                 = ""
    app_key                      = ""
    auth_secret                  = ""
  }
}

prod = {
  aws_region = "sa-east-1"

  api = {
    auth_token      = ""
    openai_token    = ""
    tiff_path       = "/opt/api/data"
    grid_tiles_path = "/opt/api/data/grid"
  }

  client = {
    next_public_api_url          = ""
    next_public_api_key          = ""
    next_public_webshot_url      = ""
    next_public_arcgis_api_key   = ""
    basic_auth_enabled           = ""
    basic_auth_user              = ""
    basic_auth_password          = ""
    payload_secret               = ""
    database_url                 = ""
    app_key                      = ""
    auth_secret                  = ""
  }
}
