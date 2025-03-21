# amazonia-360

![Screenshot 2025-03-21 at 10 10 45](https://github.com/user-attachments/assets/c5f0bc2e-46a7-490d-9262-abf8fe9ff7a1)

AmazoniaForever 360+ is a platform developed to provide critical geospatial and territorial data, supporting conservation and sustainable efforts in the Amazon region. Designed for non-expert users, it equips government officials, NGOs, local communities, and professionals working in environmental planning and development with tools to monitor environmental changes and implement strategic actions.

Platform Overview
AmazoniaForever 360+ is designed to serve spatial and statistical data through a user-friendly interface that supports:
- Exploring pre-processed geospatial indicators structured over an H3 hexagonal grid.
- Interacting with dynamic maps using tiled vector or raster layers.
- Querying aggregated data by area or administrative boundary through zonal statistics.
- Filtering geographies based on custom polygons or map extent.
- Generating reports with AI-assisted summaries. 
The platform uses ArcGIS Online to host and serve most raster and vector data, including zonal statistics, administrative boundaries, and thematic layers. A custom Python microservice is used for serving the H3 grid data in Apache Arrow format.

Architecture
AmazoniaForever 360+ uses a hybrid architecture that combines ArcGIS Online services with a custom backend for performance-sensitive data processing.

Components
- client/: React frontend using Mapbox GL JS
- api/: Node.js API (with a Python-based H3 microservice)
- infra/: xxxxx
- science/: xxxxx

Tech Stack
- Frontend: xxx
- Backend: xxx
- Geospatial Services: xxx
- Infrastructure: xxx

Running the Platform Locally
To set up AmazoniaForever 360+ on your local machine, follow these steps:​
xxxxxx

License
This project is licensed under the MIT License. See the LICENSE file for details.
