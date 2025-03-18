variable "environment_type" {
  default = {
    aws_region = string
    api = {
      auth_token      = string
      tiff_path       = string
      grid_tiles_path = string
    }
    client = {
      next_public_api_url      = string
      next_public_api_key      = string
      next_public_arcgis_api_key = string
      arcgis_client_id         = string
      arcgis_client_secret     = string
      basic_auth_enabled       = string
      basic_auth_user          = string
      basic_auth_password      = string
      session_secret           = string
    }
  }
}