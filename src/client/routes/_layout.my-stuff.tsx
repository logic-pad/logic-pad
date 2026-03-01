import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
} from '@tanstack/react-router';
import { memo, useState } from 'react';
import { FaFolder, FaPlus } from 'react-icons/fa';
import ResponsiveLayout from '../components/ResponsiveLayout';
import { cn } from '../uiHelper';
import { useMutation } from '@tanstack/react-query';
import { api } from '../online/api';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';

const NewCollectionModal = memo(function NewCollectionModal() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSeries, setIsSeries] = useState(false);
  const navigate = useNavigate();

  const createCollection = useMutation({
    mutationFn: (data: Parameters<typeof api.createCollection>) => {
      return api.createCollection(...data);
    },
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess({ id }) {
      await navigate({ to: `/collection/${id}` });
    },
  });

  return (
    <dialog id="newCollectionModal" className="modal">
      <div className="modal-box text-base-content flex flex-col gap-4 items-stretch">
        <h3 className="font-bold text-xl">Create new collection</h3>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Title</legend>
          <input
            type="text"
            placeholder="Collection title"
            className="input w-full"
            autoFocus
            maxLength={100}
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <p className="label">{title.length}/100</p>
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Description</legend>
          <textarea
            className="textarea h-24 w-full"
            placeholder="Optional"
            value={description}
            onChange={e => setDescription(e.target.value)}
          ></textarea>
          <div className="label">{description.length}/500</div>
        </fieldset>
        <fieldset className="fieldset">
          <label className="label cursor-pointer gap-12">
            <div className="flex flex-col grow">
              <span className="whitespace-normal text-base-content">
                This is a puzzle series
              </span>
              <span className="whitespace-normal">
                A puzzle series contains puzzles made by you which should be
                solved in order
              </span>
            </div>
            <input
              type="checkbox"
              className="toggle shrink-0"
              checked={isSeries}
              onChange={e => setIsSeries(e.target.checked)}
            />
          </label>
        </fieldset>
        {createCollection.isPending ? (
          <Loading />
        ) : (
          <button
            className={cn(
              'btn btn-primary',
              title.length === 0 && 'btn-disabled'
            )}
            onClick={() =>
              createCollection.mutate([title, isSeries, description])
            }
          >
            Create
          </button>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
});

export const Route = createFileRoute('/_layout/my-stuff')({
  component: memo(function MyStuff() {
    return (
      <ResponsiveLayout>
        <div className="flex mt-8 items-center justify-between flex-wrap gap-4">
          <div className="text-3xl">
            <FaFolder className="inline-block me-4" />
            My stuff
          </div>
          <div className="flex items-center gap-4">
            <Link to="/create" className="btn">
              <FaPlus />
              New puzzle
            </Link>
            <button
              className="btn"
              onClick={() =>
                (
                  document.getElementById(
                    'newCollectionModal'
                  ) as HTMLDialogElement
                ).showModal()
              }
            >
              <FaPlus />
              New collection
            </button>
            <NewCollectionModal />
          </div>
        </div>
        <Outlet />
      </ResponsiveLayout>
    );
  }),
});
