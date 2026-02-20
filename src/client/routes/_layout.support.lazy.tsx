import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { memo, useEffect, useRef, useState } from 'react';
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
import {
  FaCheckCircle,
  FaComment,
  FaEyeSlash,
  FaHeart,
  FaSave,
} from 'react-icons/fa';
import { router } from '../router/router';
import storedRedirect from '../router/storedRedirect';
import { TbLayoutGrid } from 'react-icons/tb';

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
    const paymentRef = useRef<HTMLDivElement>(null);

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
            <SupporterMedal
              supporter={me?.supporter ?? 0}
              onClick={() => {
                paymentRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
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

        <section className="self-stretch">
          <div className="rounded-box p-8 md:p-10 border border-neutral-content/15 text-neutral-content">
            <div className="flex flex-col items-center text-center gap-4">
              <blockquote className="text-lg italic leading-relaxed max-w-4xl">
                Logic Pad is a project born out of love for the game{' '}
                <a
                  href="https://islandsofinsight.com"
                  target="_blank"
                  className="link"
                  rel="noreferrer"
                >
                  Islands of Insight
                </a>
                . It is a site made by the community for the community, which is
                why it will always be free to use and ad-free. To keep the site
                sustainable, I have created this supporter program that offers
                small perks to users who choose to support the site financially.
                Your support helps keep Logic Pad running and growing, and I am
                deeply grateful for it.
              </blockquote>
            </div>
          </div>
        </section>

        <div className="self-stretch sticky top-2 z-10">
          <div className="bg-neutral/70 text-neutral-content backdrop-blur rounded-box p-3 border border-neutral-content/20">
            <div className="flex flex-wrap justify-center gap-2">
              <a
                className="btn btn-sm btn-ghost text-neutral-content"
                onClick={() => {
                  document
                    .getElementById('benefits')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Benefits
              </a>
              <a
                className="btn btn-sm btn-ghost text-neutral-content"
                onClick={() => {
                  document
                    .getElementById('funding')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Funding
              </a>
              <a
                className="btn btn-sm btn-ghost text-neutral-content"
                onClick={() => {
                  document
                    .getElementById('how-it-works')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                How It Works
              </a>
              <a
                className="btn btn-sm btn-ghost text-neutral-content"
                onClick={() => {
                  document
                    .getElementById('pricing')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {me ? 'Pricing' : 'Sign In'}
              </a>
              {me && (
                <a
                  className="btn btn-sm btn-ghost text-neutral-content"
                  onClick={() => {
                    document
                      .getElementById('payments')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Payment History
                </a>
              )}
            </div>
          </div>
        </div>

        <section id="benefits" className="self-stretch scroll-m-24">
          <div className="flex flex-col gap-6 items-center">
            <h2 className="text-3xl font-semibold text-accent text-center">
              Supporter Benefits
            </h2>
            <div className="space-y-4 self-stretch">
              <article className="rounded-box bg-neutral/35 p-4 md:p-5">
                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl mt-2">
                      Cloud solve progress across devices
                    </h3>
                    <p className="text-neutral-content/80 mt-2">
                      Save your solve progress in the cloud and access it from
                      any device.
                    </p>
                  </div>
                  <div className="md:w-84 h-28 rounded-box border-2 border-dashed border-neutral-content/20 bg-neutral/20 flex items-center justify-center text-sm text-neutral-content/60 pointer-events-none">
                    <div className="flex w-72 p-2 ps-4 rounded-2xl shadow-md bg-base-100 text-base-content text-sm items-center justify-between">
                      <span className="flex-auto">
                        Last saved 10 seconds ago
                      </span>
                      <div className="flex-1" />
                      <div
                        className="tooltip tooltip-left tooltip-info shrink-0"
                        data-tip="Save (Ctrl+S)"
                      >
                        <button className="btn btn-sm btn-ghost">
                          <FaSave size={22} />
                        </button>
                      </div>
                      <button className="btn btn-sm btn-ghost shrink-0">
                        <FaComment />
                      </button>
                    </div>
                  </div>
                </div>
              </article>

              <article className="rounded-box bg-neutral/25 p-4 md:p-5">
                <div className="flex flex-col md:flex-row-reverse gap-4 items-stretch md:items-center">
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl mt-2">
                      Search by solve status
                    </h3>
                    <p className="text-neutral-content/80 mt-2">
                      Filter by solve status when searching for puzzles.
                    </p>
                  </div>
                  <div className="md:w-84 h-28 rounded-box border-2 border-dashed border-neutral-content/20 bg-neutral/20 flex items-center justify-center text-sm text-neutral-content/60 pointer-events-none">
                    <div className="grid grid-cols-[minmax(4rem,auto)_minmax(0,1fr)] items-center gap-y-1">
                      <div className="text-sm">Solve</div>
                      <div className="flex gap-2 flex-wrap">
                        <button className="btn btn-xs text-[0.75rem] btn-ghost">
                          Any
                        </button>
                        <button className="btn btn-xs text-[0.75rem] btn-ghost">
                          Seen
                        </button>
                        <button className="btn btn-xs text-[0.75rem] btn-ghost">
                          Unseen
                        </button>
                        <button className="btn btn-xs text-[0.75rem]">
                          Unsolved
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              <article className="rounded-box bg-neutral/35 p-4 md:p-5">
                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl mt-2">
                      Unlisted puzzle and collection publishing
                    </h3>
                    <p className="text-neutral-content/80 mt-2">
                      Publish unlisted puzzles and collections and keep them
                      even if your supporter status expires.
                    </p>
                  </div>
                  <div className="md:w-84 h-28 rounded-box border-2 border-dashed border-neutral-content/20 bg-neutral/20 flex items-center justify-center text-sm text-neutral-content/60 pointer-events-none">
                    <fieldset className="fieldset w-80">
                      <label className="label cursor-pointer gap-2">
                        <div className="flex flex-col grow">
                          <span className="whitespace-normal text-base text-base-content">
                            Set puzzle to unlisted
                          </span>
                          <span className="whitespace-normal text-xs">
                            Unlisted puzzles cannot be found through browsing or
                            searching, but can be accessed by anyone with the
                            link.
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          className="toggle shrink-0"
                          checked={true}
                        />
                      </label>
                    </fieldset>
                  </div>
                </div>
              </article>

              <article className="rounded-box bg-neutral/25 p-4 md:p-5">
                <div className="flex flex-col md:flex-row-reverse gap-4 items-stretch md:items-center">
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl mt-2">
                      Unlimited private puzzle storage
                    </h3>
                    <p className="text-neutral-content/80 mt-2">
                      Store unlimited private puzzles instead of a maximum of
                      50.
                    </p>
                  </div>
                  <div className="md:w-84 h-28 rounded-box border-2 border-dashed border-neutral-content/20 bg-neutral/20 flex items-center justify-center text-sm text-neutral-content/60 pointer-events-none">
                    <div className="relative w-76 h-20 flex gap-4 items-center px-4 py-2 rounded-xl shadow-md text-base-content bg-base-300/50">
                      <TbLayoutGrid size={36} className="shrink-0" />
                      <div className="flex flex-col gap-1" aria-hidden="true">
                        <div className="skeleton animate-none w-36 h-4" />
                        <div className="skeleton animate-none w-20 h-4" />
                        <div className="flex gap-4 text-sm opacity-80">
                          <span className="flex items-center capitalize">
                            <FaEyeSlash className="me-2" />
                            <span>Private</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              <article className="rounded-box bg-neutral/35 p-4 md:p-5">
                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl mt-2">
                      Animated supporter badge
                    </h3>
                    <p className="text-neutral-content/80 mt-2">
                      Get an animated supporter badge next to your username.
                    </p>
                  </div>
                  <div className="md:w-84 h-28 rounded-box border-2 border-dashed border-neutral-content/20 bg-neutral/20 flex items-center justify-center text-sm text-neutral-content/60 pointer-events-none">
                    <span className="text-3xl">
                      {me?.name ?? 'You'}
                      <span className="relative w-fit h-[0.91em] inline-block text-accent align-baseline ms-[0.3em]">
                        <FaHeart className="effect-shine" />
                      </span>
                    </span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 self-stretch">
          <section id="funding" className="h-full scroll-m-24">
            <div className="rounded-box bg-neutral/30 h-full p-6">
              <div>
                <h2 className="text-2xl text-accent font-semibold mb-4">
                  Where Your Support Goes
                </h2>
                <div className="space-y-5 border-l-2 border-accent/30 pl-4">
                  <div className="flex items-start gap-3">
                    <div className="badge badge-accent">1</div>
                    <div>
                      <h3 className="font-semibold text-lg">Server costs</h3>
                      <p className="text-neutral-content/80">
                        Your support helps cover server costs so that Logic Pad
                        can be completely ad-free for everyone.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="badge badge-accent">2</div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        Scaling infrastructure
                      </h3>
                      <p className="text-neutral-content/80">
                        Your support helps fund improvements to the site and new
                        features that require more server resources.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="badge badge-accent">3</div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        Reward for creators
                      </h3>
                      <p className="text-neutral-content/80">
                        In the future, most of the supporter revenue will go
                        towards rewarding puzzle creators for their high-quality
                        puzzles.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="how-it-works" className="h-full scroll-m-24">
            <div className="rounded-box bg-neutral/30 h-full p-6">
              <div>
                <h2 className="text-2xl text-accent font-semibold mb-4">
                  How Supporter Status Works
                </h2>
                <div className="space-y-5 border-l-2 border-accent/30 pl-4">
                  <div className="flex items-start gap-3">
                    <div className="badge badge-accent">1</div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        One-time Purchase
                      </h3>
                      <p className="text-neutral-content/80">
                        Each purchase is a non-recurring payment that adds time
                        to your supporter duration.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="badge badge-accent">2</div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        Stacks with Existing Time
                      </h3>
                      <p className="text-neutral-content/80">
                        New purchases extend your current supporter period, so
                        you never lose time.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="badge badge-accent">3</div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        Expiration Notifications
                      </h3>
                      <p className="text-neutral-content/80">
                        You&apos;ll receive in-site notifications when your
                        supporter status is about to expire.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="badge badge-accent">4</div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        Content Retention
                      </h3>
                      <p className="text-neutral-content/80">
                        Contents created with supporter benefits are kept even
                        if your supporter status expires, so your creations are
                        always safe.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Pricing Section / Call to action */}
        {me ? (
          <section
            id="pricing"
            ref={paymentRef}
            className="self-stretch scroll-m-24"
          >
            <h2 className="text-3xl font-semibold text-accent mb-4 text-center">
              Choose Your Support Duration
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
                    className="rounded-box bg-base-100/20 shadow border border-neutral-content/15 hover:bg-base-100/30 hover:shadow-lg w-72 transition-all"
                  >
                    <div className="p-6">
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
                        <div className="text-xs text-base-content/60">
                          total
                        </div>
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
                  </div>
                ))
              ) : (
                <Loading className="w-full h-48" />
              )}
            </div>
          </section>
        ) : (
          <section
            id="pricing"
            className="self-stretch rounded-box bg-neutral/30 scroll-m-24"
          >
            <div className="p-8 flex flex-col items-center gap-6">
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
          </section>
        )}

        {/* Payment History Section */}
        {me && (
          <section
            id="payments"
            className="p-6 self-stretch flex flex-col items-center rounded-box bg-neutral/30 scroll-m-24"
          >
            <h2 className="text-3xl font-semibold text-accent mb-6 text-center">
              Payment History
            </h2>
            {paymentHistory.data?.pages[0].results.length ? (
              <div className="overflow-x-auto max-w-full w-fit">
                <div className="flex flex-col gap-2 items-center w-fit">
                  <table className="table">
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
                            <td className="font-mono max-w-56 overflow-x-hidden">
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
          </section>
        )}
      </ResponsiveLayout>
    );
  }),
});
