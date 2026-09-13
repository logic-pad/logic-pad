import Elysia from 'elysia';
import { api } from '../../client/online/api';
import { indexHtml, SECURITY_HEADERS, SITE_URL } from '../config';
import { getCachedPage, setCachedPage } from '../cache';

// SSR pages are served to everyone, so interpolated values must be safe
// to embed into the HTML meta tags.
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const ssr = new Elysia()
  .mapResponse(({ responseValue }) => {
    return new Response(responseValue as BodyInit, {
      headers: {
        'content-type': 'text/html; charset=utf8',
        'cache-control': 's-maxage=3600, stale-while-revalidate',
        ...SECURITY_HEADERS,
      },
    });
  })
  .get('/solve/:puzzleId', async ({ params: { puzzleId }, path }) => {
    const cached = getCachedPage(path);
    if (cached) return cached;

    try {
      const puzzle = await api.getPuzzleBriefForSolve(puzzleId);
      const customizedHtml = indexHtml
        .replace(/Logic Pad/g, `${escapeHtml(puzzle.title)} - Logic Pad`)
        .replace(
          /A modern, open-source web app for grid-based puzzles\./g,
          `A puzzle by ${escapeHtml(puzzle.creator.name)} on Logic Pad.`
        )
        .replace(
          /\/pwa-512x512.png/g,
          `${SITE_URL}/api/preview/puzzle/${puzzle.id}`
        );
      setCachedPage(path, customizedHtml);
      return customizedHtml;
    } catch {
      return indexHtml;
    }
  })
  .get(
    '/collection/:collectionId',
    async ({ params: { collectionId }, path }) => {
      const cached = getCachedPage(path);
      if (cached) return cached;

      try {
        const collection = await api.getCollectionBrief(collectionId);
        const customizedHtml = indexHtml
          .replace(/Logic Pad/g, `${escapeHtml(collection.title)} - Logic Pad`)
          .replace(
            /A modern, open-source web app for grid-based puzzles\./g,
            `A ${collection.isSeries ? 'series' : 'collection'} by ${escapeHtml(collection.creator.name)} on Logic Pad.`
          )
          .replace(
            /\/pwa-512x512.png/g,
            `${SITE_URL}/api/preview/collection/${collection.id}`
          );
        setCachedPage(path, customizedHtml);
        return customizedHtml;
      } catch {
        return indexHtml;
      }
    }
  )
  .get('/profile/:userId', async ({ params: { userId }, path }) => {
    const cached = getCachedPage(path);
    if (cached) return cached;

    try {
      const user = await api.getUser(userId);
      if (!user) return indexHtml;

      const customizedHtml = indexHtml
        .replace(/Logic Pad/g, `${escapeHtml(user.name)} - Logic Pad`)
        .replace(
          /A modern, open-source web app for grid-based puzzles\./g,
          escapeHtml(user.title ?? '')
        )
        .replace(
          /\/pwa-512x512.png/g,
          `${SITE_URL}/api/preview/user/${user.id}`
        );
      setCachedPage(path, customizedHtml);
      return customizedHtml;
    } catch {
      return indexHtml;
    }
  });
