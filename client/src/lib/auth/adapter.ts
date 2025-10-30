import { getPayload, SanitizedConfig } from "payload";

import type { Adapter, AdapterAccount, AdapterUser, AdapterAccountType } from "@auth/core/adapters";

import { Account, User } from "@/payload-types";

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

export interface PayloadAdapterOptions {
  /**
   * The Payload instance
   */
  config?: SanitizedConfig;
}

export async function PayloadAuthAdapter({ config }: PayloadAdapterOptions): Promise<Adapter> {
  if (!config) {
    throw new Error(
      "PayloadAdapter requires either a `payload` instance or a `payloadConfig` to be provided",
    );
  }

  const payload = await getPayload({ config });

  return {
    createUser: async ({ id: _id, ...data }) => {
      const user = await payload.create({
        collection: "users",
        data: {
          email: data.email,
          name: data.name,
          emailVerified: data.emailVerified ? data.emailVerified.toISOString() : null,
          image: data.image,
          password: "password",
        },
      });
      return covertPayloadUserToAdapterUser(user);
    },

    getUserByAccount: async (providerAccount) => {
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
      const updatedUser = await payload.update({
        collection: "users",
        id: Number(id),
        data: {
          email: data.email,
          name: data.name,
          emailVerified: data.emailVerified ? data.emailVerified.toISOString() : null,
          image: data.image,
        },
      });
      return covertPayloadUserToAdapterUser(updatedUser);
    },

    linkAccount: async (account) => {
      const createdAccount = await payload.create({
        collection: "accounts",
        data: {
          user: Number(account.userId),
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
      try {
        const user = await payload.findByID({
          collection: "users",
          id: Number(id),
        });
        return covertPayloadUserToAdapterUser(user);
      } catch (_error) {
        return null;
      }
    },

    getUserByEmail: async (email) => {
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
