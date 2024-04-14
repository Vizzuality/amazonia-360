provider "aws" {
  region  = var.region
  profile = var.profile
}

provider "acme" {
  server_url = "https://acme-v02.api.letsencrypt.org/directory"
  alias = "vancluever"
}