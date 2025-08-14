# Webshot Service

A NestJS-based microservice for generating PDF reports or PNG snapshots from web
pages using headless Chromium, via Playwright.

*Important note*: the webshot service is designed to be accessed via private PVC
from the NextJS server, so an endpoint on the NextJS server must be created for
each webshot-related request that the web app needs to send. These endpoints
will then forward the relevant requests to the webshot service, and finally
relay back responses (PDF or PNG files) to the web app.

Given that no direct browser access is available, CORS is not configured on the
webshot service.

During development, in practice, the webshot service _is_ accessible directly in
dev/staging/production instances (`POST
https://dev.amazoniaforever360.org/webshot/api/v1/report/pdf` and `POST
https://dev.amazoniaforever360.org/webshot/api/v1/report/png`, and likewise for
staging and production hostnames) to support testing things from local
environments using live instances. However, once development is finalised, the
webshot service will be made inaccessible from the outside world.

## Usage

For development, you can run the service locally using Docker Compose.

First, create a `.env.webshot` file, copying the contents of
`.env.webshot.default`, and adapting values to your local environment.

In a standard setup, if running the NextJS client service locally on port 3000,
the default URL to use as `APP_BASE_URL` in the `.env.webshot.default` file will
be ok. If using basic auth, the relevant user and password env vars must also be
set in the `.env.webshot` file so that the headless Chrome instance within the
webshot service can authenticate with the client app.

Once the `.env.webshot` file is ready, you can start the service using Docker Compose:

```bash
docker compose up --build webshot
```

For examples of how to use the local service, see the following sections.

Given the example payloads below, the webshot service will navigate to the
target page, concatenating the base URL configured for the webshot instance via
the `APP_BASE_URL` environment variable and the `pagePath` property provided in
the `POST` payload.

In local instances, the `APP_BASE_URL` can be set as appropriate (normally it
will point to a local instance of the frontend app, but it can be set to point
to a live frontend app instance such as the staging or production one). In
dev/staging/production instances, the webshot will always point to the frontend
app on the same environment (this is set automatically when configuring the
infrastructure via Terraform).

### Report Generation

```
POST http://localhost:3003/webshot/api/v1/report/pdf
Content-Type: application/json

{
  "pagePath": "/en/report/results?%3Fbbox=-9179719.906994147,-723616.366654413,-7381921.00172728,109241.49354064604&topics={\"id\":1,\"indicators\":[{\"id\":26,\"type\":\"numeric\",\"x\":3,\"y\":0,\"w\":1,\"h\":1},{\"id\":26,\"type\":\"map\",\"x\":2,\"y\":3,\"w\":2,\"h\":4},{\"id\":10,\"type\":\"chart\",\"x\":2,\"y\":1,\"w\":2,\"h\":2},{\"id\":13,\"type\":\"numeric\",\"x\":0,\"y\":0,\"w\":1,\"h\":1},{\"id\":25,\"type\":\"numeric\",\"x\":2,\"y\":0,\"w\":1,\"h\":1},{\"id\":12,\"type\":\"numeric\",\"x\":1,\"y\":0,\"w\":1,\"h\":1},{\"id\":29,\"type\":\"map\",\"x\":0,\"y\":5,\"w\":2,\"h\":4},{\"id\":24,\"type\":\"chart\",\"x\":0,\"y\":1,\"w\":2,\"h\":2}]},{\"id\":4,\"indicators\":[{\"id\":72,\"type\":\"map\",\"x\":0,\"y\":0,\"w\":2,\"h\":4},{\"id\":58,\"type\":\"map\",\"x\":2,\"y\":0,\"w\":2,\"h\":4}]}&location={\"type\":\"polygon\",\"geometry\":{\"spatialReference\":{\"wkid\":102100},\"rings\":[[[-8280820.454360714,-260331.5382180824],[-7778132.337843387,19848.38896115661],[-7925655.802433738,-634223.2620749235],[-8280820.454360714,-260331.5382180824]]]},\"buffer\":0}&gridFiltersSetUp={\"limit\":10,\"opacity\":100,\"direction\":\"desc\"}",
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [-70.0, -4.0],
        [-65.0, -4.0],
        [-65.0, -2.0],
        [-70.0, -2.0],
        [-70.0, -4.0]
      ]
    ]
  },
  "generatedTextContent": {
    "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  }
}
```

The `geometry` and `generatedTextContent` properties are optional.

If `geometry` is provided, it will be passed through by the webshot service to
the target page by calling `window.setGeometry(geometry)` (therefore, this
function must be implemented in the target page, available to receive the
`geometry` GeoJSON object and use it as needed for rendering the page).

Likewise for the `generatedTextContent` property: if supplied in the request
payload, it will be passed through by the webshot service to the target page by
calling `window.setGeneratedTextContent(textContent)`. The content of the
`generatedTextContent` property is just passed through by the webshot service
without any validation: it must be an object, but its structure and content are
left to the app to define and consume accordingly.

### PNG Snapshots of widgets

```
POST http://localhost:3003/webshot/api/v1/widgets/png
Content-Type: application/json

{
    "pagePath": "/en",
    "outputFileName": "precipitation-widget.png",
    "params": {
        "param1": "value1",
        "param2": "value2"
    }
}
```

The `outputFileName` and `params` properties are optional.

If provided, the `outputFileName` will be used as the name of the output file.
If not provided, the output file will be named `widget.png`.

If provided, the `params` object will be passed through by the webshot service
to the target page by calling `window.setWidgetParams(params)`. The content of
the `params` object is just passed through by the webshot service without any
validation: it must be an object, but its structure and content are left to the
app to define and consume accordingly.
