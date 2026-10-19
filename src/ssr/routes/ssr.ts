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

type Locale = 'en' | 'ja';

/**
 * The document declares `lang="en"` in `index.html`; a prefixed page must
 * declare its own, otherwise crawlers are told the Japanese page is English.
 */
function withLang(html: string, locale: Locale): string {
  return locale === 'en'
    ? html
    : html.replace(/<html lang="en"/, '<html lang="ja"');
}

/**
 * Look a page up in the cache, render it through `customize`, and fall back to
 * the bare shell if the data call fails (a slow or unhealthy API must never
 * turn an indexable page into a 500).
 */
async function renderPage(
  path: string,
  locale: Locale,
  customize: () => Promise<string>
): Promise<string> {
  const cached = getCachedPage(path);
  if (cached) return cached;
  try {
    const html = withLang(await customize(), locale);
    setCachedPage(path, html);
    return html;
  } catch {
    return withLang(indexHtml, locale);
  }
}

function solvePage(puzzleId: string, path: string, locale: Locale) {
  return renderPage(path, locale, async () => {
    const puzzle = await api.getPuzzleBriefForSolve(puzzleId);
    return indexHtml
      .replace(/Logic Pad/g, `${escapeHtml(puzzle.title)} - Logic Pad`)
      .replace(
        /A modern, open-source web app for grid-based puzzles\./g,
        `A puzzle by ${escapeHtml(puzzle.creator.name)} on Logic Pad.`
      )
      .replace(
        /\/pwa-512x512.png/g,
        `${SITE_URL}/api/preview/puzzle/${puzzle.id}`
      );
  });
}

function collectionPage(collectionId: string, path: string, locale: Locale) {
  return renderPage(path, locale, async () => {
    const collection = await api.getCollectionBrief(collectionId);
    return indexHtml
      .replace(/Logic Pad/g, `${escapeHtml(collection.title)} - Logic Pad`)
      .replace(
        /A modern, open-source web app for grid-based puzzles\./g,
        `A ${collection.isSeries ? 'series' : 'collection'} by ${escapeHtml(collection.creator.name)} on Logic Pad.`
      )
      .replace(
        /\/pwa-512x512.png/g,
        `${SITE_URL}/api/preview/collection/${collection.id}`
      );
  });
}

function profilePage(userId: string, path: string, locale: Locale) {
  return renderPage(path, locale, async () => {
    const user = await api.getUser(userId);
    if (!user) return indexHtml;
    return indexHtml
      .replace(/Logic Pad/g, `${escapeHtml(user.name)} - Logic Pad`)
      .replace(
        /A modern, open-source web app for grid-based puzzles\./g,
        escapeHtml(user.title ?? '')
      )
      .replace(/\/pwa-512x512.png/g, `${SITE_URL}/api/preview/user/${user.id}`);
  });
}

/**
 * The locale-prefixed pages are registered as explicit routes rather than
 * through `group()`, so the `mapResponse` hook below unambiguously covers them
 * and the path params stay typed.
 *
 * `/en/...` never reaches here: the static server 301s it to the unprefixed
 * path, which is the canonical form for the default locale.
 */
export const ssr = new Elysia()
  .mapResponse(({ responseValue }) => {
    return new Response(responseValue as BodyInit, {
      headers: {
        'content-type': 'text/html; charset=utf8',
        // Freshness is provided by the in-memory page cache, not by the
        // browser: a cached document would point at assets that the next
        // deploy removes.
        'cache-control': 'no-cache',
        ...SECURITY_HEADERS,
      },
    });
  })
  .get('/solve/:puzzleId', ({ params: { puzzleId }, path }) =>
    solvePage(puzzleId, path, 'en')
  )
  .get('/collection/:collectionId', ({ params: { collectionId }, path }) =>
    collectionPage(collectionId, path, 'en')
  )
  .get('/profile/:userId', ({ params: { userId }, path }) =>
    profilePage(userId, path, 'en')
  )
  .get('/ja/solve/:puzzleId', ({ params: { puzzleId }, path }) =>
    solvePage(puzzleId, path, 'ja')
  )
  .get('/ja/collection/:collectionId', ({ params: { collectionId }, path }) =>
    collectionPage(collectionId, path, 'ja')
  )
  .get('/ja/profile/:userId', ({ params: { userId }, path }) =>
    profilePage(userId, path, 'ja')
  );
