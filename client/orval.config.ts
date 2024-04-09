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
      target: "http://15.188.19.207:8000/openapi.json",
      filters: {},
    },
  },
};
