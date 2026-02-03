import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: `${import.meta.env?.VITE_API_ENDPOINT as string}/auth`,
  basePath: '/auth',

  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: 'string',
          required: true,
          input: false,
          defaultValue: 'user',
        },
        banned: {
          type: 'boolean',
          required: true,
          input: false,
          defaultValue: false,
        },
        banReason: {
          type: 'string',
          required: false,
          input: false,
        },
        banExpires: {
          type: 'date',
          required: false,
          input: false,
        },
      },
      session: {
        impersonatedBy: {
          type: 'string',
          required: false,
          input: false,
        },
      },
      account: {
        email: {
          type: 'string',
          required: false,
          input: false,
        },
      },
    }),
  ],
});

// Type inference doesn't work for accounts yet, so we define it here
export type Account = {
  scopes: string[];
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  providerId: string;
  accountId: string;
  email: string | null;
};
