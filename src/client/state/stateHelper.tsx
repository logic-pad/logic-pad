import { useSetAtom, Atom, useAtomValue, WritableAtom } from 'jotai';
import { useEffect, RefObject } from 'react';

/**
 * Keeps a scoped atom in sync with a prop after mount.
 * ScopeProvider initial values only apply when the scope is created.
 */
export function SyncPropToAtom<T>({
  atom,
  value,
}: {
  atom: WritableAtom<T, [T], void>;
  value: T;
}) {
  const set = useSetAtom(atom);
  useEffect(() => {
    set(value);
  }, [set, value]);
  return null;
}

/**
 * Mirrors an atom's value into a ref, for reading the current value
 * outside of React's render cycle (e.g. when a modal closes).
 */
export function SyncAtomToRef<T>({
  atom,
  ref,
}: {
  atom: Atom<T>;
  ref: RefObject<T>;
}) {
  const value = useAtomValue(atom);
  useEffect(() => {
    ref.current = value;
  }, [ref, value]);
  return null;
}
