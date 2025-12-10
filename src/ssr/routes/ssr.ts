import Elysia from 'elysia';
import indexHtml from '../../../dist/index.html';
import { isbot } from 'isbot';
import { api } from '../../client/online/api';

export const ssr = new Elysia()
  .mapResponse(({ responseValue }) => {
    return new Response(responseValue as BodyInit, {
      headers: {
        'content-type': 'text/html; charset=utf8',
        'cache-control': 's-maxage=3600, stale-while-revalidate',
      },
    });
  })
  .get('/solve/:puzzleId', async ({ params: { puzzleId }, headers }) => {
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
  })
  .get(
    '/collection/:collectionId',
    async ({ params: { collectionId }, headers }) => {
      if (!headers['user-agent'] || !isbot(headers['user-agent'])) {
        return indexHtml;
      }
      if (typeof collectionId !== 'string' || collectionId.length === 0) {
        return indexHtml;
      }

      const collection = await api.getCollectionBrief(collectionId);
      if (!collection) {
        return indexHtml;
      }

      const customizedHtml = (indexHtml as unknown as string)
        .replace(/Logic Pad/g, `${collection.title} - Logic Pad`)
        .replace(
          /A modern, open-source web app for grid-based puzzles\./g,
          `A ${collection.isSeries ? 'series' : 'collection'} by ${collection.creator.name} on Logic Pad.`
        )
        .replace(
          /\/pwa-512x512.png/g,
          `https://${process.env.VERCEL_URL}/api/preview/collection/${collection.id}`
        );
      return customizedHtml;
    }
  )
  .get('/profile/:userId', async ({ params: { userId }, headers }) => {
    if (!headers['user-agent'] || !isbot(headers['user-agent'])) {
      return indexHtml;
    }
    if (typeof userId !== 'string' || userId.length === 0) {
      return indexHtml;
    }

    const user = await api.getUser(userId);
    if (!user) {
      return indexHtml;
    }

    const customizedHtml = (indexHtml as unknown as string)
      .replace(/Logic Pad/g, `${user.name} - Logic Pad`)
      .replace(
        /A modern, open-source web app for grid-based puzzles\./g,
        user.title ?? ''
      )
      .replace(
        /\/pwa-512x512.png/g,
        `https://${process.env.VERCEL_URL}/api/preview/user/${user.id}`
      );
    return customizedHtml;
  });
