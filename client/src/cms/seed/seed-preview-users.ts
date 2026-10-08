import type { Payload } from "payload";

export const DEFAULT_PREVIEW_USERS_PASSWORD = "12345678";

const upsertPreviewAccount = async (
  payload: Payload,
  collection: "admins" | "users",
  email: string,
  password: string,
): Promise<void> => {
  const { docs } = await payload.find({
    collection,
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
  });

  if (docs[0]) {
    const data = collection === "users" ? { password, _verified: true } : { password };
    await payload.update({ collection, id: docs[0].id, data });
  } else if (collection === "users") {
    await payload.create({
      collection,
      data: { email, password, _verified: true },
      disableVerificationEmail: true,
    });
  } else {
    await payload.create({ collection, data: { email, password } });
  }
};

export const seedPreviewUsers = async (
  payload: Payload,
  emails: readonly string[],
  password: string,
): Promise<void> => {
  const lowerCaseEmails = emails.map((value) => value.toLowerCase());
  await Promise.all(
    (["admins", "users"] as const).flatMap((collection) =>
      lowerCaseEmails.map((email) => upsertPreviewAccount(payload, collection, email, password)),
    ),
  );
};
