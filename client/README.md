# AmazoniaForever360+ Front-end

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, make sure you have the following installed:

- [Node.js](https://nodejs.org) (check .nvmrc file for the version used)
- [pnpm](https://pnpm.io) (recommended package manager)

To get started, clone the repository and install the dependencies:

```bash
pnpm install
```

Then, create a `.env.local` file from the template `.env.default` at the root of the project and fill in the needed environment variables.

| Variable Name                 | Description                                                                          | Example Value                            |
| ----------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------- |
| `NEXT_PUBLIC_URL`             | Base URL for the Next.js app                                                         | `http://localhost:$PORT`                 |
| `NEXT_PUBLIC_API_URL`         | API URL for the application                                                          | `https://dev.amazoniaforever360.org/api` |
| `NEXT_PUBLIC_API_KEY`         | API key for authentication                                                           | `""` (empty by default)                  |
| `NEXT_PUBLIC_ARCGIS_API_KEY`  | ArcGIS API key                                                                       | `""` (empty by default)                  |
| `BASIC_AUTH_ENABLED`          | Enables Basic Authentication (`true`/`false`)                                        | `true`                                   |
| `BASIC_AUTH_USER`             | Username for Basic Authentication (only used in development and staging environment) | `user`                                   |
| `BASIC_AUTH_PASSWORD`         | Password for Basic Authentication (only used in development and staging environment) | `password`                               |
| `ENV NEXT_PUBLIC_WEBSHOT_URL` | Webshot URL                                                                          |

## Development

To run the development server, use the following command:

```bash
pnpm dev
```

This will start the Next.js development server on [http://localhost:3000](http://localhost:3000).
You can view your application in the browser by navigating to [http://localhost:3000](http://localhost:3000).
The page will reload if you make edits. You will also see any lint errors in the console.

## Production

To build the application for production, use the following command:

```bash
pnpm build
```

This will create an optimized production build of your application in the `.next` directory.
You can then start the production server with:

```bash
pnpm start
```

This will start the Next.js server in production mode. You can view your application in the browser by navigating to [http://localhost:3000](http://localhost:3000).
The page will not reload if you make edits. You will also see any lint errors in the console.

## Tests

To run the tests, use the following command:

```bash
pnpm test
```

This will run the tests using Jest. You can also run the tests in watch mode with:

```bash
pnpm test:watch
```

This will run the tests in watch mode, allowing you to see the results as you make changes to your code.

## Linting

To run the linter, use the following command:

```bash
pnpm lint && pnpm check-types
```

This will run ESLint and TypeScript type checking on your code. There is a husky pre-commit hook that will run the linter before each commit to ensure that your code is properly formatted and free of linting errors.
