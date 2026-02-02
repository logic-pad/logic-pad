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
          nullable: false,
          input: false,
          default: 'user',
        },
        banned: {
          type: 'boolean',
          nullable: false,
          input: false,
          default: false,
        },
        banReason: {
          type: 'string',
          nullable: true,
          input: false,
        },
        banExpires: {
          type: 'date',
          nullable: true,
          input: false,
        },
      },
      session: {
        impersonatedBy: {
          type: 'string',
          nullable: true,
          input: false,
        },
      },
    }),
  ],
});
