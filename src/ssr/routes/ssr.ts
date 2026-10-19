import Elysia from 'elysia';
import { api } from '../../client/online/api';
import { indexHtml, SECURITY_HEADERS, SITE_URL } from '../config';
import { getCachedPage, setCachedPage } from '../cache';
import { type Locale, i18nFor } from '../locales';

// SSR pages are served to everyone, so interpolated values must be safe
// to embed into the HTML meta tags.
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * The absolute URL of a preview image in `locale`.
 *
 * The default locale is unprefixed, mirroring how pages are addressed, so
 * `/api/preview/puzzle/x` and `/api/preview/ja/puzzle/x` are the two forms.
 */
function previewUrl(
  locale: Locale,
  kind: 'puzzle' | 'collection' | 'user',
  id: string
) {
  return `${SITE_URL}/api/preview/${locale === 'en' ? '' : `${locale}/`}${kind}/${id}`;
}

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
    const i18n = i18nFor(locale);
    const puzzle = await api.getPuzzleBriefForSolve(puzzleId);
    return indexHtml
      .replace(
        /Logic Pad/g,
        escapeHtml(i18n.t('ssr.solve.title', { title: puzzle.title }))
      )
      .replace(
        /A modern, open-source web app for grid-based puzzles\./g,
        escapeHtml(
          i18n.t('ssr.solve.description', {
            author: puzzle.creator.name,
          })
        )
      )
      .replace(/\/pwa-512x512.png/g, previewUrl(locale, 'puzzle', puzzle.id));
  });
}

function collectionPage(collectionId: string, path: string, locale: Locale) {
  return renderPage(path, locale, async () => {
    const i18n = i18nFor(locale);
    const collection = await api.getCollectionBrief(collectionId);
    const description = collection.isSeries
      ? i18n.t('ssr.series.description', { author: collection.creator.name })
      : i18n.t('ssr.collection.description', {
          author: collection.creator.name,
        });
    return indexHtml
      .replace(
        /Logic Pad/g,
        escapeHtml(i18n.t('ssr.collection.title', { title: collection.title }))
      )
      .replace(
        /A modern, open-source web app for grid-based puzzles\./g,
        escapeHtml(description)
      )
      .replace(
        /\/pwa-512x512.png/g,
        previewUrl(locale, 'collection', collection.id)
      );
  });
}

function profilePage(userId: string, path: string, locale: Locale) {
  return renderPage(path, locale, async () => {
    const i18n = i18nFor(locale);
    const user = await api.getUser(userId);
    if (!user) return indexHtml;
    return indexHtml
      .replace(
        /Logic Pad/g,
        escapeHtml(i18n.t('ssr.profile.title', { name: user.name }))
      )
      .replace(
        /A modern, open-source web app for grid-based puzzles\./g,
        escapeHtml(user.title ?? '')
      )
      .replace(/\/pwa-512x512.png/g, previewUrl(locale, 'user', user.id));
  });
}

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
