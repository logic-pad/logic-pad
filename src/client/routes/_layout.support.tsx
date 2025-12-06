import { createFileRoute, redirect } from '@tanstack/react-router';
import { queryOptions } from '@tanstack/react-query';
import { api, bidirectionalInfiniteQuery, queryClient } from '../online/api';
import toast from 'react-hot-toast';

export const supporterPricesQueryOptions = queryOptions({
  queryKey: ['supporter', 'prices'],
  queryFn: () => api.listSupporterPrices(),
});

export const paymentHistoryQueryOptions = bidirectionalInfiniteQuery(
  ['supporter', 'payments'],
  api.listPaymentHistory,
  false
);

export const Route = createFileRoute('/_layout/support')({
  loader: () => {
    try {
      void queryClient.ensureQueryData(supporterPricesQueryOptions);
    } catch (error) {
      toast.error((error as Error).message);
      throw redirect({
        to: '/',
      });
    }
  },
  head: () => ({
    meta: [
      {
        title: `Supporting Logic Pad - Logic Pad`,
      },
    ],
  }),
});
