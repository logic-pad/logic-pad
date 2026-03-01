import { createFileRoute } from '@tanstack/react-router';
import storedRedirect from '../router/storedRedirect';
import { router } from '../router/router';

export const Route = createFileRoute('/redirect')({
  loader: async () => {
    const result = await storedRedirect.execute();
    if (!result) {
      await router.navigate({ to: '/' });
    }
  },
});
