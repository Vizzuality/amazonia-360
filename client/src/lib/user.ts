import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { User } from "@/payload-types";

import { sdk } from "@/services/sdk";

export const useUser = (id: User["id"] | undefined) => {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => sdk.findByID({ collection: "users", id: id as User["id"] }),
    enabled: !!id,
  });
};

export const useUpdateUserCommunityOptIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, communityOptIn }: { id: User["id"]; communityOptIn: boolean }) => {
      return sdk.update({
        collection: "users",
        id,
        data: { communityOptIn },
      });
    },
    onSuccess: (_data, { id }) => {
      return queryClient.invalidateQueries({ queryKey: ["user", id] });
    },
  });
};

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
