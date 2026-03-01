import { memo, useEffect, useRef, useState } from 'react';
import { FaCheck, FaEdit } from 'react-icons/fa';
import { cn } from '../uiHelper';
import Loading from './Loading';

export interface EditableFieldProps {
  initialValue: string;
  editable?: boolean;
  pending?: boolean;
  onEdit?: (newValue: string) => void;
  className?: string;
}

export default memo(function EditableField({
  initialValue,
  editable,
  pending,
  onEdit,
  className,
}: EditableFieldProps) {
  editable ??= false;
  pending ??= false;
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.innerText = initialValue;
    }
  }, [initialValue]);

  return (
    <div className={cn('flex gap-1 items-baseline', className)}>
      <div
        ref={inputRef}
        contentEditable={editable && editing}
        className={cn(
          'border-2 p-1 rounded-sm border-transparent border-dashed',
          editable && editing && 'border-base-100 min-w-24'
        )}
      ></div>
      <div
        className={cn(
          'border-2 p-1 rounded-sm border-transparent border-dashed italic opacity-50',
          (!editable || editing || initialValue.length > 0) && 'hidden'
        )}
      >
        (Empty)
      </div>
      {pending && <Loading className="w-4 h-4 m-2" />}
      {!pending && editable && (
        <button
          className="btn btn-ghost btn-sm shrink-0 px-2"
          onClick={() => {
            const title = inputRef.current?.innerText.trim() ?? initialValue;
            if (editing && title !== initialValue) {
              onEdit?.(title);
            }
            setEditing(!editing);
          }}
        >
          {editing ? <FaCheck /> : <FaEdit />}
        </button>
      )}
    </div>
  );
});
