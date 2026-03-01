export enum SolutionHandling {
  LoadVisible = 'visible',
  LoadHidden = 'hidden',
  Remove = 'remove',
}

function validateLoader(value: string): SolutionHandling | undefined {
  if (Object.values(SolutionHandling).includes(value as SolutionHandling)) {
    return value as SolutionHandling;
  }
  return undefined;
}

export interface PuzzleParams {
  d?: string;
  loader?: SolutionHandling;
}

export const validateSearch = (
  search: Record<string, unknown>
): PuzzleParams => {
  return {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    d: search.d ? String(search.d) : undefined,
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    loader: search.loader ? validateLoader(String(search.loader)) : undefined,
  };
};
