import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { memo, useEffect, useState } from 'react';
import ResponsiveLayout from '../components/ResponsiveLayout';
import Footer from '../components/Footer';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  paymentHistoryQueryOptions,
  supporterPricesQueryOptions,
} from './_layout.support';
import { api } from '../online/api';
import { useOnline } from '../contexts/OnlineContext';
import SupporterMedal from '../components/SupporterMedal';
import { toRelativeDate } from '../uiHelper';
import InfiniteScrollTrigger from '../components/InfiniteScrollTrigger';
import Loading from '../components/Loading';
import { FaCheckCircle } from 'react-icons/fa';
import { router } from '../router/router';
import storedRedirect from '../router/storedRedirect';

export const Route = createLazyFileRoute('/_layout/support')({
  component: memo(function RouteComponent() {
    const navigate = useNavigate();
    const { me } = useOnline();
    const [successAlert] = useState(
      () => router.state.location.hash === 'success'
    );
    const { data: supporterPrices } = useQuery({
      ...supporterPricesQueryOptions,
      enabled: !!me,
    });
    const paymentHistory = useInfiniteQuery({
      ...paymentHistoryQueryOptions,
      enabled: !!me,
    });
    useEffect(() => {
      if (successAlert) {
        void navigate({
          to: '.',
          hash: '',
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <ResponsiveLayout
        className="gap-20 items-center max-w-[900px]!"
        footer={<Footer />}
      >
        {me ? (
          <div className="flex self-stretch items-center flex-wrap justify-center mt-12 gap-8 *:shrink-0">
            <div className="flex flex-col gap-8 flex-1 min-w-96">
              <div className="text-4xl text-accent">Supporting Logic Pad</div>
              <div className="text-lg">
                {me?.supporterUntil
                  ? new Date(me.supporterUntil) > new Date()
                    ? `Your supporter status expires ${toRelativeDate(new Date(me?.supporterUntil), 'day')} (${new Date(me?.supporterUntil).toLocaleDateString()})`
                    : `Your supporter status expired ${toRelativeDate(new Date(me?.supporterUntil), 'day')}`
                  : `You haven't ever had supporter status`}
              </div>
              <progress
                className="progress progress-accent h-4 w-full"
                value={
                  me?.supporterUntil
                    ? new Date(me?.supporterUntil).getTime() -
                      new Date().getTime()
                    : 0
                }
                max={1000 * 60 * 60 * 24 * 365}
              ></progress>
            </div>
            <SupporterMedal supporter={me?.supporter ?? 0} />
          </div>
        ) : (
          <div className="flex self-stretch items-center flex-wrap justify-center mt-12 gap-8 *:shrink-0">
            <div className="text-4xl text-accent">Supporting Logic Pad</div>
          </div>
        )}

        {successAlert && !!me && (
          <div className="alert alert-success max-w-lg flex gap-4 items-center">
            <FaCheckCircle size={48} className="inline mr-2" />
            <div>
              <div className="font-semibold">
                Thank you for supporting Logic Pad!
              </div>
              <div className="text-sm">
                You may refresh the page if your supporter status has not been
                updated yet.
              </div>
            </div>
          </div>
        )}

        {/* Quote Section */}
        <div className="p-8 bg-base-100 text-base-content rounded-lg shadow-sm">
          <blockquote className="text-xl italic text-center leading-relaxed">
            Logic Pad is a project born out of love for the game{' '}
            <a
              href="https://islandsofinsight.com"
              target="_blank"
              className="link"
              rel="noreferrer"
            >
              Islands of Insight
            </a>
            . It is a site made by the community for the community, which is why
            it will always be free to use and ad-free. To keep the site
            sustainable, I have created this supporter program that offers small
            perks to users who choose to support the site financially. Your
            support helps keep Logic Pad running and growing, and I am deeply
            grateful for it.
          </blockquote>
        </div>

        {/* Current Benefits Section */}
        <div className="p-6">
          <h2 className="text-3xl font-semibold text-accent mb-6 text-center">
            Supporter Benefits
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-lg">
              <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                <span className="text-accent-content text-sm">✓</span>
              </div>
              <span>Animated supporter badge next to your username</span>
            </div>
          </div>
          <p className="text-sm text-base-content/70 mt-4 text-center">
            More features are being developed! Your support helps make them
            possible.
          </p>
        </div>

        {/* How It Works Section */}
        <div className="p-6">
          <h2 className="text-3xl font-semibold text-accent mb-6 text-center">
            How Supporter Status Works
          </h2>
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-accent text-accent-content rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-lg">One-time Purchase</h3>
                <p className="text-base-content/80">
                  Each purchase is a non-recurring payment that adds time to
                  your supporter duration.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-accent text-accent-content rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  Stacks with Existing Time
                </h3>
                <p className="text-base-content/80">
                  New purchases extend your current supporter period, so you
                  never lose time.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-accent text-accent-content rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  Expiration Notifications
                </h3>
                <p className="text-base-content/80">
                  You&apos;ll receive in-site notifications when your supporter
                  status is about to expire.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Section / Call to action */}
        {me ? (
          <div>
            <h2 className="text-3xl font-semibold text-accent mb-4 text-center">
              Choose Your Support Level
            </h2>
            {supporterPrices && (
              <p className="text-sm text-base-content/70 mb-6 text-center">
                All prices are in {supporterPrices[0]?.currency || 'USD'}
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-6">
              {supporterPrices ? (
                supporterPrices.map(price => (
                  <div
                    key={price.priceId}
                    className="p-6 rounded-lg shadow-md bg-base-100 hover:bg-base-200 text-base-content hover:shadow-lg transition-all"
                  >
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold mb-2">
                        {price.months} Month{price.months > 1 ? 's' : ''}
                      </h3>
                      <div className="text text-base-content/70 mb-2">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: price.currency,
                        }).format(price.price / price.months)}{' '}
                        × {price.months} months
                      </div>
                      <div className="text-2xl font-bold text-accent">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: price.currency,
                        }).format(price.price)}
                      </div>
                      <div className="text-xs text-base-content/60">total</div>
                    </div>
                    <button
                      className="w-full btn btn-primary"
                      onClick={() => {
                        api.checkoutSupporter(
                          price.priceId,
                          window.location.origin + '/support#success',
                          window.location.origin + '/support'
                        );
                      }}
                    >
                      Support Logic Pad
                    </button>
                  </div>
                ))
              ) : (
                <Loading className="w-full h-48" />
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <h2 className="text-3xl font-semibold text-accent mb-4 text-center">
              Sign in to Support Logic Pad
            </h2>
            <button
              className="btn btn-lg btn-primary shrink-0 w-fit"
              onClick={async () => {
                await navigate({
                  to: '/auth',
                  search: {
                    redirect: storedRedirect.set(router.state.location),
                  },
                });
              }}
            >
              Sign in / sign up
            </button>
          </div>
        )}

        {/* Payment History Section */}
        {me && (
          <div className="p-6 self-stretch flex flex-col items-center">
            <h2 className="text-3xl font-semibold text-accent mb-6 text-center">
              Payment History
            </h2>
            {paymentHistory.data?.pages[0].results.length ? (
              <div className="overflow-x-auto max-w-full w-fit">
                <div className="flex flex-col gap-2 items-center w-fit">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Order ID</th>
                        <th>Items</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.data.pages.map(page =>
                        page.results.map(payment => (
                          <tr key={payment.id}>
                            <td>
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </td>
                            <td className="font-mono max-w-32 overflow-x-hidden">
                              {payment.order}
                            </td>
                            <td className="min-w-32">
                              {payment.items.join(', ')}
                            </td>
                            <td>
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: payment.currency,
                              }).format(Number(payment.amount) / 100)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  {paymentHistory.isFetching ? (
                    <Loading className="w-4 h-4" />
                  ) : paymentHistory.hasNextPage ? (
                    <InfiniteScrollTrigger
                      onLoadMore={async () =>
                        await paymentHistory.fetchNextPage()
                      }
                      className="btn-sm"
                    />
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="text-center text-base-content/70">
                No payment history found.
              </div>
            )}
          </div>
        )}
      </ResponsiveLayout>
    );
  }),
});
