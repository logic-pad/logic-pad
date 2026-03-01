import { createFileRoute } from '@tanstack/react-router';
import { validateSearch } from '../router/linkLoaderValidator';

export const Route = createFileRoute('/_layout/solve/')({
  validateSearch,
});
