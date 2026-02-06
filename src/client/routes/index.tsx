import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { Suspense, lazy, memo, useState } from 'react';
import QuickAccessBar from '../components/QuickAccessBar';
import Changelog from '../components/Changelog';
import Loading from '../components/Loading';
import PWAPrompt from '../components/PWAPrompt';
import toast from 'react-hot-toast';
import FrontPageLists from '../online/FrontPageLists';
import PersonalFrontPageLists from '../online/PersonalFrontPageLists';
import { useOnline } from '../contexts/OnlineContext';
import Footer from '../components/Footer';
import { api } from '../online/api';
import NavigationSkip from '../components/NavigationSkip';
import storedRedirect from '../router/storedRedirect';
import { router } from '../router/router';

const FrontPageGrid = lazy(async () => {
  const Grid = (await import('../grid/Grid')).default;
  const { GridData, GridConnections } = await import('@logic-pad/core');

  const grid = GridData.create([
    '.nwww',
    'nnwbb',
    'nnwbw',
    'nnBwW',
    '.nnn.',
  ]).withConnections(
    GridConnections.create(['..aaa', '..abb', '..ab.', '.....', '.....'])
  );

  return {
    default: memo(function FrontPageGrid() {
      return (
        <Grid
          type="canvas"
          size={100}
          grid={grid}
          editable={false}
          className="absolute left-1/2 xl:right-0 top-1/2 -translate-x-1/2 -translate-y-1/2 shrink -rotate-[5deg] opacity-75 fade-in-fast"
        />
      );
    }),
  };
});

const RandomPuzzle = memo(function RandomPuzzle() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (loading) {
    return <Loading className="bg-base-100/10" />;
  }

  return (
    <button
      className="btn btn-ghost h-fit py-1 md:py-2 bg-base-100/10"
      onClick={async () => {
        setLoading(true);
        try {
          const { id } = await api.getRandomPuzzle();
          await navigate({ to: `/solve/${id}` });
        } catch (ex) {
          if (ex instanceof Error) {
            toast.error(ex.message);
          }
        } finally {
          setLoading(false);
        }
      }}
    >
      I&apos;m feeling lucky
    </button>
  );
});

export const Route = createFileRoute('/')({
  component: memo(function Home() {
    const { isOnline, me, isPending } = useOnline();
    const navigate = useNavigate();
    return (
      <>
        <main className="flex flex-col gap-4 items-stretch min-h-svh shrink-0">
          <div className="flex flex-col shrink-0">
            <NavigationSkip />
            <PWAPrompt />
            <QuickAccessBar className="justify-end px-8 py-2" />
            <section className="flex flex-col xl:flex-row grow gap-32 items-center justify-center p-16 z-10">
              <div className="relative order-1 grow shrink self-stretch overflow-visible pointer-events-none -z-10 min-h-64 m-16">
                <div className="absolute w-0 h-0 top-1/2 left-1/2 logo-glow fade-in-fast"></div>
                <Suspense fallback={null}>
                  <FrontPageGrid />
                </Suspense>
              </div>
              <div className="flex flex-wrap shrink-0 grow-0 justify-center gap-8">
                <div className="relative w-32 h-32 inline-block">
                  <div className="absolute w-0 h-0 top-1/2 left-1/2 logo-glow fade-in-slow"></div>
                  <div
                    className="absolute inset-0 w-fit h-fit tooltip tooltip-bottom"
                    data-tip="Merry Christmas!"
                  >
                    <img src="/logo.svg" alt="Logic Pad logo" />
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <h1
                    id="main-content"
                    className="text-accent text-4xl lg:text-6xl font-medium font-serif"
                  >
                    Logic Pad
                  </h1>
                  <span className="text-xl lg:text-2xl">
                    A modern, open-source web app for grid-based puzzles.
                  </span>

                  {isOnline ? (
                    <div className="grid grid-cols-2 w-fit flex-wrap gap-4 items-center mt-8">
                      <Link
                        type="button"
                        to="/create"
                        className="btn btn-md h-fit py-1 md:btn-lg md:py-4 md:px-6 btn-accent"
                      >
                        Create new puzzle
                      </Link>
                      <Link
                        type="button"
                        to="/search"
                        className="btn btn-md h-fit py-1 md:btn-lg md:py-4 md:px-6 btn-accent btn-outline"
                      >
                        Explore puzzles
                      </Link>
                      <Link
                        type="button"
                        to="/uploader"
                        className="btn btn-ghost h-fit py-1 md:py-2 bg-base-100/10"
                      >
                        Bulk-import puzzles
                      </Link>
                      <RandomPuzzle />
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-4 items-center mt-8">
                      <Link
                        type="button"
                        to="/create"
                        className="btn btn-md h-fit py-1 md:btn-lg md:py-4 md:px-6 btn-accent"
                      >
                        Create new puzzle
                      </Link>
                      <div className="m-4 opacity-80">
                        Go online for more features
                      </div>
                    </div>
                  )}
                  <Changelog />
                </div>
              </div>
            </section>
          </div>
          <section className="mt-8 px-8 pb-8 shrink-0 xl:px-32 flex flex-col gap-8 max-w-[calc(320px*4+3rem)] box-content self-center *:shrink-0">
            {isOnline && <FrontPageLists />}
            {isOnline &&
              (me ? (
                <PersonalFrontPageLists />
              ) : (
                !isPending && (
                  <div className="w-fit self-center flex flex-col items-center gap-4 p-8 bg-base-200/20 rounded-lg">
                    <span className="text-center text-lg">
                      Sign in to track your progress and upload your own puzzles
                    </span>
                    <button
                      className="btn btn-accent btn-lg"
                      onClick={() =>
                        navigate({
                          to: '/auth',
                          search: {
                            redirect: storedRedirect.set(router.state.location),
                          },
                        })
                      }
                    >
                      Sign In / Sign Up
                    </button>
                  </div>
                )
              ))}
          </section>
        </main>
        <Footer />
      </>
    );
  }),
});
