import { useMutation } from "@tanstack/react-query";

import { User } from "@/payload-types";

import { sdk } from "@/services/sdk";

export const useDeleteUser = () => {
  return useMutation({
    mutationFn: (id: User["id"]) => {
      if (!id) {
        return Promise.reject(new Error("ID is required to delete the report."));
      }

      return sdk.delete({
        collection: "users",
        id,
      });
    },
  });
};
