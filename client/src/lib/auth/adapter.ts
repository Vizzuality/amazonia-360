import { BasePayload, getPayload, SanitizedConfig } from "payload";

import config from "@payload-config";

import type { Adapter, AdapterAccount, AdapterUser, AdapterAccountType } from "@auth/core/adapters";

import { Account, User } from "@/payload-types";

declare module "@auth/core/adapters" {
  interface AdapterUser {
    password?: string | null;
  }
}

const covertPayloadUserToAdapterUser = (user: User): AdapterUser => {
  return {
    ...user,
    id: String(user.id),
    emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
  };
};

const convertPayloadAccountToAdapterAccount = (account: Account): AdapterAccount => {
  const userId = String((account.user as User).id);
  const type = account.type as AdapterAccountType;
  const { provider, providerAccountId } = account;
  return { type, userId, provider, providerAccountId };
};

export function PayloadAuthAdapter(): Adapter {
  let p: BasePayload | null = null;

  const getPayloadInstance = async (config: Promise<SanitizedConfig>) => {
    if (p) return p;
    p = await getPayload({ config });
    return p;
  };

  return {
    createUser: async ({ id: _id, ...data }) => {
      const payload = await getPayloadInstance(config);

      const user = await payload.create({
        collection: "users",
        disableVerificationEmail: !data.password, // Disable verification email if no password is set, that means OAuth signup
        data: {
          name: data.name,
          image: data.image,
          email: data.email,
          password: data.password || crypto.randomUUID(),
        },
      });
      return covertPayloadUserToAdapterUser(user);
    },

    getUserByAccount: async (providerAccount) => {
      const payload = await getPayloadInstance(config);
      const { provider, providerAccountId } = providerAccount;
      const accountResponse = await payload.find({
        collection: "accounts",
        where: {
          providerAccountId: { equals: providerAccountId },
          provider: { equals: provider },
        },
      });
      if (accountResponse.docs.length === 0) {
        return null;
      }
      const account = accountResponse.docs[0];
      return covertPayloadUserToAdapterUser(account.user as User);
    },

    updateUser: async ({ id, ...data }) => {
      const payload = await getPayloadInstance(config);

      const updatedUser = await payload.update({
        collection: "users",
        id,
        data: {
          email: data.email,
          name: data.name,
          image: data.image,
          password: data.password || undefined,
        },
      });
      return covertPayloadUserToAdapterUser(updatedUser);
    },

    linkAccount: async (account) => {
      const payload = await getPayloadInstance(config);

      await payload.update({
        collection: "users",
        id: account.userId,
        data: {
          _verified: true,
        },
      });

      const createdAccount = await payload.create({
        collection: "accounts",
        data: {
          user: account.userId,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          type: account.type,
        },
      });
      return convertPayloadAccountToAdapterAccount(createdAccount);
    },

    getUser: async (id) => {
      const payload = await getPayloadInstance(config);
      try {
        const user = await payload.findByID({
          collection: "users",
          id,
        });
        return covertPayloadUserToAdapterUser(user);
      } catch (_error) {
        return null;
      }
    },

    getUserByEmail: async (email) => {
      const payload = await getPayloadInstance(config);
      const userResponse = await payload.find({
        collection: "users",
        where: {
          email: { equals: email },
        },
      });
      if (userResponse.docs.length === 0) {
        return null;
      }
      return covertPayloadUserToAdapterUser(userResponse.docs[0]);
    },

    getAccount: async (providerAccountId, provider) => {
      const payload = await getPayloadInstance(config);
      const accountResponse = await payload.find({
        collection: "accounts",
        where: {
          providerAccountId: { equals: providerAccountId },
          provider: { equals: provider },
        },
      });
      if (accountResponse.docs.length === 0) {
        return null;
      }
      return convertPayloadAccountToAdapterAccount(accountResponse.docs[0]);
    },
  };
}
