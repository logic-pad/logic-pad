import { memo, useId, useState } from 'react';
import { useOnlinePuzzle } from '../contexts/OnlinePuzzleContext';
import { useMutation, useQuery } from '@tanstack/react-query';
import { puzzleEditQueryOptions } from '../routes/_layout.create.$puzzleId';
import { ResourceStatus } from '../online/data';
import { FaCheckSquare, FaHeart } from 'react-icons/fa';
import Loading from '../components/Loading';
import { Compressor } from '@logic-pad/core/data/serializer/compressor/allCompressors';
import { Serializer } from '@logic-pad/core/data/serializer/allSerializers';
import { useGrid } from '../contexts/GridContext';
import storedRedirect from '../router/storedRedirect';
import { useOnline } from '../contexts/OnlineContext';
import RatedDifficulty from '../metadata/RatedDifficulty';
import { api, ApiError, queryClient } from '../online/api';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { pluralize, safeClipboard, toRelativeDate } from '../uiHelper';
import CommentSidebar from '../online/CommentSidebar';
import { SolutionHandling } from '../router/linkLoaderValidator';

// million-ignore
const SignInWithProgress = memo(function SignInWithProgress() {
  const { metadata, grid, solution } = useGrid();
  const navigate = useNavigate();
  return (
    <button
      className="btn btn-primary"
      onClick={async () => {
        const data = await Compressor.compress(
          Serializer.stringifyPuzzle({ ...metadata, grid, solution })
        );
        await navigate({
          to: '/auth',
          search: {
            redirect: storedRedirect.set({
              to: '/create',
              search: {
                loader: SolutionHandling.LoadVisible,
                d: data,
              },
            }),
          },
          ignoreBlocker: true,
        });
      }}
    >
      Sign in / sign up
    </button>
  );
});

// million-ignore
const UploadPuzzle = memo(function UploadPuzzle() {
  const uploadPuzzle = useMutation({
    mutationFn: (data: Parameters<typeof api.createPuzzle>) => {
      return api.createPuzzle(...data);
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const { metadata, grid } = useGrid();
  const navigate = useNavigate();

  if (uploadPuzzle.isPending) {
    return (
      <button className="btn btn-primary btn-disabled">
        <Loading />
      </button>
    );
  }

  if (uploadPuzzle.isSuccess) {
    return (
      <button className="btn btn-primary btn-disabled">Redirecting...</button>
    );
  }

  return (
    <button
      className="btn btn-primary"
      onClick={async () => {
        const data = await Compressor.compress(Serializer.stringifyGrid(grid));
        const puzzle = await uploadPuzzle.mutateAsync([
          metadata.title,
          metadata.description,
          metadata.difficulty,
          data,
        ]);
        await navigate({
          to: `/create/${puzzle.id}`,
          ignoreBlocker: true,
        });
      }}
    >
      Upload puzzle
    </button>
  );
});

// million-ignore
const DeletePuzzle = memo(function DeletePuzzle() {
  const { id } = useOnlinePuzzle();
  const navigate = useNavigate();
  const { metadata, grid, solution } = useGrid();
  const deletePuzzle = useMutation({
    mutationFn: async (puzzleId: string) => {
      await api.deletePuzzle(puzzleId);
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  if (deletePuzzle.isPending) {
    return (
      <button className="btn btn-error btn-disabled">
        <Loading />
      </button>
    );
  }

  if (deletePuzzle.isSuccess) {
    return (
      <button className="btn btn-error btn-disabled">Redirecting...</button>
    );
  }

  return (
    <button
      className="btn btn-error"
      onClick={async () => {
        await deletePuzzle.mutateAsync(id!);
        const data = await Compressor.compress(
          Serializer.stringifyPuzzle({ ...metadata, grid, solution })
        );
        await navigate({
          to: '/create',
          search: {
            loader: SolutionHandling.LoadVisible,
            d: data,
          },
          ignoreBlocker: true,
        });
      }}
    >
      Delete puzzle
    </button>
  );
});

// million-ignore
const PublishPuzzle = memo(function PublishPuzzle() {
  const modalId = useId();
  const { id } = useOnlinePuzzle();
  const { metadata, grid } = useGrid();
  const publishPuzzle = useMutation({
    mutationFn: async (data: Parameters<typeof api.savePuzzle>) => {
      await api.savePuzzle(...data);
      return await api.publishPuzzle(data[0]);
    },
    onError(error) {
      if (!(error instanceof ApiError) || error.status !== 451)
        toast.error(error.message);
    },
    async onSuccess() {
      await queryClient.refetchQueries({
        queryKey: ['puzzle', 'edit', id],
      });
    },
  });

  if (publishPuzzle.isPending) {
    return (
      <button className="btn btn-primary btn-disabled">
        <Loading />
      </button>
    );
  }

  if (publishPuzzle.isSuccess) {
    return (
      <button className="btn btn-primary btn-disabled">Refreshing...</button>
    );
  }

  return (
    <>
      <button
        className="btn btn-primary"
        onClick={async () => {
          await publishPuzzle.mutateAsync([
            id!,
            metadata.title,
            metadata.description,
            metadata.difficulty,
            await Compressor.compress(Serializer.stringifyGrid(grid)),
          ]);
          await queryClient.refetchQueries({
            queryKey: ['puzzle', 'edit', id],
          });
        }}
      >
        Publish puzzle
      </button>
      {publishPuzzle.error instanceof ApiError &&
        publishPuzzle.error.status === 451 && (
          <dialog
            id={`publishExternalPuzzleModal-${modalId}`}
            className="modal modal-open"
          >
            <div className="modal-box flex flex-col gap-4 text-base font-thin">
              <h3 className="font-bold text-xl text-accent">
                Failed to publish your puzzle
              </h3>
              <p className="my-2">{publishPuzzle.error.message}</p>
              <p>
                Logic Pad is a place for creators to share their original
                puzzles.{' '}
                <b className="font-bold">
                  Uploading puzzles from other games or publications is strictly
                  prohibited due to copyright restrictions.
                </b>{' '}
                Even if the similarity is unintentional, this restriction still
                applies.
              </p>
              <p>
                Attempting to upload, or circumvent restrictions to upload,
                copyrighted content will result in a ban from this platform.
              </p>
              <p>
                If you love a puzzle game and want to share it with our
                community, please create an original puzzle inspired by that
                game and credit the source in your description. This allows you
                to introduce others to the game while respecting the game
                creator&apos;s intellectual property.
              </p>
              <div className="modal-action">
                <form method="dialog">
                  <button className="btn" onClick={() => publishPuzzle.reset()}>
                    I understand
                  </button>
                </form>
              </div>
            </div>
            <form method="dialog" className="modal-backdrop">
              <button onClick={() => publishPuzzle.reset()}>close</button>
            </form>
          </dialog>
        )}
    </>
  );
});

// million-ignore
export default memo(function EditorOnlineTab() {
  const { isOnline, me } = useOnline();
  const { id } = useOnlinePuzzle();
  const { data, isLoading } = useQuery(puzzleEditQueryOptions(id));
  const [commentsOpen, setCommentsOpen] = useState(false);

  if (isLoading) {
    return <Loading />;
  }

  if (!id || !data) {
    return (
      <div className="flex flex-col gap-4 p-8 bg-base-100 text-base-content rounded-2xl shadow-lg w-full max-w-[800px] animate-online-tab">
        <p className="text-2xl font-bold">Editing locally</p>
        {!isOnline ? (
          <p>Go online to upload your puzzle and access it from anywhere.</p>
        ) : !me ? (
          <>
            <p>
              Sign in to upload your puzzle and access it from anywhere. Your
              will keep your current progress by signing in with the button
              below.
            </p>
            <SignInWithProgress />
          </>
        ) : (
          <>
            <p>
              Upload your puzzle to access it from anywhere. Your puzzle will be
              kept as a private draft until you publish it.
            </p>
            <p>Only upload puzzles that you created yourself.</p>
            <UploadPuzzle />
          </>
        )}
      </div>
    );
  }

  if (data.status === ResourceStatus.Private) {
    return (
      <div className="flex flex-col gap-4 p-8 bg-base-100 text-base-content rounded-2xl shadow-lg w-full max-w-[800px] animate-online-tab">
        <p className="text-2xl font-bold">Online information</p>
        <div className="flex gap-2 items-center">
          <div className="badge badge-lg badge-neutral p-4">Private</div>
        </div>
        <div>Created {toRelativeDate(new Date(data.createdAt))}</div>
        <DeletePuzzle />
        <div className="divider" />
        <p className="text-2xl font-bold">Publish puzzle</p>
        <p>
          Publish this puzzle for public access when it is ready to be solved.
        </p>
        <ul className="list-disc list-inside">
          <li>Completion statistics will be available after publish.</li>
          <li>
            You can update the puzzle after publishing, but statistics will not
            be reset.
          </li>
          <li>You cannot unpublish a puzzle.</li>
          <li>Do not publish unfinished puzzles.</li>
        </ul>
        <PublishPuzzle />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-8 bg-base-100 text-base-content rounded-2xl shadow-lg w-full max-w-[800px] animate-online-tab">
      <p className="text-2xl font-bold">Online information</p>
      <div className="flex gap-4 items-center">
        <div className="badge badge-lg badge-info p-4">Public</div>
        <span className="badge badge-lg p-4 badge-neutral">
          <FaCheckSquare className="inline-block me-2" />{' '}
          {pluralize(data.solveCount)`solve``solves`}
        </span>
        <span className="badge badge-lg p-4 badge-neutral">
          <FaHeart className="inline-block me-2" />{' '}
          {pluralize(data.loveCount)`love``loves`}
        </span>
      </div>
      <div>
        Created {toRelativeDate(new Date(data.createdAt))}
        <br />
        {data.publishedAt
          ? `Published ${toRelativeDate(new Date(data.publishedAt))}`
          : ''}
      </div>
      <RatedDifficulty
        collapsible={false}
        ratedDifficulty={data.ratedDifficulty}
      />
      <button
        className="btn btn-primary"
        onClick={async () => {
          const url = new URL(window.location.href);
          url.pathname = '/solve/' + id;
          await safeClipboard.writeText(url.href);
          toast.success('Link copied!');
        }}
      >
        Copy solve link
      </button>
      <div className="divider" />
      <p className="text-2xl font-bold">Comments</p>
      <button className="btn w-full" onClick={() => setCommentsOpen(true)}>
        Open comments
      </button>
      <CommentSidebar
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />
    </div>
  );
});
