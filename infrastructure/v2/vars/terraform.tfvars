aws_profile="amazonia360"
allowed_account_id="851725508245"
project_name="amazonia360"
repo_name="amazonia-360"
github_owner="Vizzuality"
github_token=""

dev = {
    aws_region="eu-west-3"

    api = {
        auth_token=""
        tiff_path="/opt/api/data"
        grid_tiles_path="/opt/api/data/grid"
    }

    client = {
        next_public_api_url=""
        next_public_api_key=""
        next_public_arcgis_api_key=""
        arcgis_client_id=""
        arcgis_client_secret=""
        basic_auth_user=""
        basic_auth_password=""
        session_secret=""
    }
}

staging = {
    aws_region="eu-west-3"

    api = {
        auth_token=""
        tiff_path="/opt/api/data"
        grid_tiles_path="/opt/api/data/grid"
    }

    client = {
        next_public_api_url=""
        next_public_api_key=""
        next_public_arcgis_api_key=""
        arcgis_client_id=""
        arcgis_client_secret=""
        basic_auth_user=""
        basic_auth_password=""
        session_secret=""
    }
}

prod = {
    aws_region="sa-east-1"

    api = {
        auth_token=""
        tiff_path="/opt/api/data"
        grid_tiles_path="/opt/api/data/grid"
    }

    client = {
        next_public_api_url=""
        next_public_api_key=""
        next_public_arcgis_api_key=""
        arcgis_client_id=""
        arcgis_client_secret=""
        basic_auth_user=""
        basic_auth_password=""
        session_secret=""
    }
}