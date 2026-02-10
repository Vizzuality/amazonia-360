import { CollectionBeforeChangeHook, CollectionBeforeDeleteHook } from "payload";

export const beforeDeleteAnonymousUser: CollectionBeforeDeleteHook = async ({ req, id }) => {
  // Find and delete related documents in the 'reports' collection
  await req.payload.delete({
    collection: "reports",
    where: {
      "user.relationTo": {
        equals: "anonymous-users",
      },
      "user.value": {
        equals: id,
      },
    },
    req,
  });
};

export const beforeDeleteUser: CollectionBeforeDeleteHook = async ({ req, id }) => {
  // Find and delete related account in the 'accounts' collection
  await req.payload.delete({
    collection: "accounts",
    where: {
      user: {
        equals: id,
      },
    },
    req,
  });

  await req.payload.delete({
    collection: "reports",
    where: {
      "user.relationTo": {
        equals: "users",
      },
      "user.value": {
        equals: id,
      },
    },
    req,
  });
};

export const beforeChangeLinkUser: CollectionBeforeChangeHook = async ({
  req,
  data,
  operation,
}) => {
  if (operation !== "create") {
    return data;
  }

  data ||= {};
  if (data.user) {
    return data;
  }

  if (req.user?.id) {
    data.user = {
      relationTo: req.user.collection,
      value: req.user.id,
      createdAt: req.user.createdAt,
    };
    return data;
  }

  return data;
};
