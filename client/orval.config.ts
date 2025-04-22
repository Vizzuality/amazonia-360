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
      target: "https://dev.amazoniaforever360.org/api/openapi.json",
      filters: {},
    },
  },
};
