import { CollectionBeforeChangeHook } from "payload";

export const linkUserHook: CollectionBeforeChangeHook = async ({ req, data, operation }) => {
  if (operation !== "create") {
    return data;
  }

  data ||= {};
  if (data.user) {
    return data;
  }

  if (req.user?.id) {
    if (req.user.collection === "anonymous-users") {
      data.user = { relationTo: req.user.collection, value: req.user.apiKey };
    }

    data.user = { relationTo: req.user.collection, value: req.user.id };
    return data;
  }

  return data;
};
