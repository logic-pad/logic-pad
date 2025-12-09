import Elysia from 'elysia';
import indexHtml from '../../../dist/index.html';
import { isbot } from 'isbot';
import { api } from '../../client/online/api';

export const ssr = new Elysia().get(
  '/solve/:puzzleId',
  async ({ params: { puzzleId }, set, headers }) => {
    set.headers['content-type'] = 'text/html';
    set.headers['cache-control'] = 's-maxage=3600, stale-while-revalidate';

    if (!headers['user-agent'] || !isbot(headers['user-agent'])) {
      return indexHtml;
    }
    if (typeof puzzleId !== 'string' || puzzleId.length === 0) {
      return indexHtml;
    }

    const puzzle = await api.getPuzzleBriefForSolve(puzzleId);
    if (!puzzle) {
      return indexHtml;
    }

    const customizedHtml = (indexHtml as unknown as string)
      .replace(/Logic Pad/g, `${puzzle.title} - Logic Pad`)
      .replace(
        /A modern, open-source web app for grid-based puzzles\./g,
        `A puzzle by ${puzzle.creator.name} on Logic Pad.`
      )
      .replace(
        /\/pwa-512x512.png/g,
        `https://${process.env.VERCEL_URL}/api/preview/puzzle/${puzzle.id}`
      );
    return customizedHtml;
  }
);
