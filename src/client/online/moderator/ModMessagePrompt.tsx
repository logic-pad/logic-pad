import React, { memo, RefObject, useImperativeHandle, useState } from 'react';
import { cn } from '../../uiHelper';

export type PromptHandle = {
  prompt: (description: string) => Promise<string>;
};

export async function modPrompt(
  handle: RefObject<PromptHandle | null>,
  description: string
) {
  if (!handle.current) {
    const result = window.prompt(`Message to user:\n\n${description}`);
    if (!result) throw new Error('Prompt cancelled');
    return result;
  }
  return await handle.current.prompt(description);
}

export interface ModMessagePromptProps {
  ref?: React.Ref<PromptHandle>;
}

export default memo(function ModMessagePrompt({ ref }: ModMessagePromptProps) {
  const [handle, setHandle] = useState<{
    resolve: (message: string) => void;
    reject: () => void;
  } | null>(null);
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');

  useImperativeHandle(ref, () => ({
    prompt: (description: string) => {
      setDescription(description);
      return new Promise((resolve, reject) => setHandle({ resolve, reject }));
    },
  }));

  return (
    <dialog
      id="modMessageModal"
      className={cn('modal', handle && 'modal-open')}
    >
      {handle && (
        <>
          <div className="modal-box">
            <h3 className="font-bold text-lg">Message to user</h3>
            <p className="py-4">
              If possible, the user will receive an account notification with
              this message.
            </p>
            <textarea
              className="textarea textarea-bordered w-full"
              autoFocus
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
            <div className="alert my-4 text-sm">{description}</div>
            <div className="modal-action">
              <button
                className="btn"
                onClick={() => {
                  handle.reject();
                  setMessage('');
                  setHandle(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  handle.resolve(message);
                  setMessage('');
                  setHandle(null);
                }}
              >
                Send
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button
              type="button"
              onClick={() => {
                handle.reject();
                setMessage('');
                setHandle(null);
              }}
            >
              close
            </button>
          </form>
        </>
      )}
    </dialog>
  );
});
