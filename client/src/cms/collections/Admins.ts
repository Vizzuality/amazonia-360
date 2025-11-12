import { CollectionConfig, getPayload } from "payload";

import config from "@payload-config";

import { logout } from "@payloadcms/next/auth";

export const Admins: CollectionConfig = {
  slug: "admins",
  admin: {
    useAsTitle: "email",
  },
  auth: true,
  hooks: {
    // When the user is logged in with a non-admin user (users collection), they are asked to log
    // out by Payload by clicking on a “Log out” button. Unfortunately, this button does not work
    // and simply brings the user back to the same page.
    // To work around this, the hook below automatically logs out the user when performing any
    // admins-related operation. The user will still be presented a page that tells them to log out
    // first, but if they reload or click the button, they are at least shown the login form.
    beforeOperation: [
      async ({ req }) => {
        const payload = await getPayload({ config });
        const { user } = await payload.auth({ headers: req.headers });

        if (user?.collection === "users") {
          await logout({ config });
        }
      },
    ],
  },
  fields: [
    // Email added by default
    // Add more fields as needed
  ],
};
