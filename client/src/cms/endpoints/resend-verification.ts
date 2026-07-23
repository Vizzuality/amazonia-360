import crypto from "node:crypto";

import type { PayloadHandler } from "payload";

import { z } from "zod";

import { buildVerifyEmailHTML, VERIFY_EMAIL_SUBJECT } from "@/cms/emails/verify-email";

const resendSchema = z.object({
  email: z.string().email(),
});

const GENERIC_SUCCESS_MESSAGE =
  "If an account exists with that email, a verification link has been sent.";

export const resendVerificationHandler: PayloadHandler = async (req) => {
  let body: unknown;
  try {
    body = await req.json?.();
  } catch {
    return Response.json({ message: "Invalid request body." }, { status: 400 });
  }

  if (body === undefined) {
    return Response.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = resendSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ message: "Invalid email address." }, { status: 400 });
  }

  const { email } = parsed.data;

  const { docs: users } = await req.payload.find({
    collection: "users",
    where: { email: { equals: email } },
    overrideAccess: true,
    limit: 1,
  });

  const user = users[0];

  if (!user || user._verified) {
    return Response.json({ message: GENERIC_SUCCESS_MESSAGE });
  }

  const token = crypto.randomBytes(20).toString("hex");

  await req.payload.update({
    collection: "users",
    id: user.id,
    data: {
      _verificationToken: token,
    },
    overrideAccess: true,
  });

  const html = buildVerifyEmailHTML({ email, token });

  await req.payload.sendEmail({
    to: email,
    subject: VERIFY_EMAIL_SUBJECT,
    html,
  });

  return Response.json({ message: GENERIC_SUCCESS_MESSAGE });
};
