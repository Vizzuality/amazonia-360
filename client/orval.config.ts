module.exports = {
  ccsa: {
    output: {
      mode: "tags",
      client: "axios-functions",
      target: "./src/types/generated/api.ts",
      mock: false,
      clean: true,
      prettier: true,
      override: {
        mutator: {
          path: "./src/services/api.ts",
          name: "API",
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: true,
        },
      },
    },
    input: {
      target: "https://dev.amazonia360.dev-vizzuality.com/api/openapi.json",
      filters: {},
    },
  },
};
