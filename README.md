# AmazoniaForever360+

![Screenshot 2025-03-21 at 10 10 45](https://github.com/user-attachments/assets/c5f0bc2e-46a7-490d-9262-abf8fe9ff7a1)

AmazoniaForever360+ is a platform developed to provide critical geospatial and territorial data, supporting conservation and sustainable efforts in the Amazon region. Designed for non-expert users, it equips government officials, NGOs, local communities, and professionals working in environmental planning and development with tools to monitor environmental changes and implement strategic actions.

# Table of contents

1. [Quick start](#run)
2. [Platform Overview](#overview)
3. [Architecture](#arch)
   1. [Components](#components)
      1. [Front-end](client/README.md)
      2. [Backend API](api/README.md)
      3. [Infrastructure](infrastructure/README.md)
      4. [Science and prototypes](science/README.md)
   2. [Tech Stack](#stack)
4. [License](#licence)


# Quick start: running the platform (via Docker Compose) <a name="run"></a>

To set up AmazoniaForever360+ on your local machine first create a `.env` file
from the template `.env.default` at the root of the project and fill in the
needed environment variables.

This `.env` file at the root of the project repository is _the source of truth_
for all the environment variables used by the platform when running it locally
via Docker Compose.

A script is provided (`splitenv.mjs`) to create the relevant `.env` files in
each service's directory. This script can be run from the root directory as
follows:

```
pnpm splitenv
```

Therefore, any changes to the root `.env` file need to be followed by running
the `splitenv` script to update the `.env` files in each service's directory.

The env vars for each service (client, api, webshot) _must_ be prefixed with the
service name in uppercase, followed by two underscores (`__`); for example,
`CLIENT__NEXT_PUBLIC_URL`. `splitenv` will then pick only the env vars that
match each service, strip the prefix and write them to the relevant `.env` file.

Once the `.env` files are up to date, to start the platform, run

```
docker compose up --build
```

from the root directory to spin all the services (client, api, webshot).

Now visiting http://localhost:3000 in any browser should show the landing page.

Note that some environment variables are secret tokens needed to authorize the
use of some parts of the API like ArcGIS services which may be crucial for some
of the application features; these values should be stored in a secure vault for
team collaboration, and never committed to the repository.

# Platform Overview <a name="overview"></a>
AmazoniaForever360+ is designed to serve spatial and statistical data through a user-friendly interface that supports:
- Exploring pre-processed geospatial indicators structured over an H3-based hexagonal grid. This allows quick access to
    large number of datasets and the ability to easily cross-filter any of them.
- An in-depth report for all available data sources.
- Querying aggregated data by area or administrative boundary through zonal statistics.
- Filtering geographies based on custom polygons or map extent.
- Generating reports with AI-assisted summaries.

The platform uses ArcGIS Online to host and serve most raster and vector data, including zonal statistics, administrative boundaries,
and thematic layers. The h3 data server and AI summary reports are build in an independent python application.

A detailed overview of the platform's architecture can be found in the
[project's
documentation](https://docs.google.com/document/d/1zMUy7LCuAu1jx8edtgkjLHTlraGle7hrVwHDmIuzzXc/edit?tab=t.0#heading=h.cyq84yp1w21t).

# Architecture <a name="arch"></a>

AmazoniaForever360+ uses a hybrid architecture that combines ArcGIS Online services with a custom backend for performance-sensitive data processing.

## Components <a name="components"></a>

- [Front-end](client/README.md): `client/`. React frontend using Mapbox GL JS and ArcGIS SDK
- [Backend API](api/README.md): `api/`. Python FastAPI service for h3 data server and AI  summary generation
- [Infrastructure](infrastructure/README.md): `infrastructure/`. Infrastructure management with Terraform
- [Science and prototypes](science/README.md): `science/`. Python prototypes and data management sketches.

## Tech Stack <a name="stack"></a>

- Frontend: React, Next.js, ArcGIS SDK
- Backend: python FastAPI
- Infrastructure: Terraform

# License <a name="licence"></a>
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
