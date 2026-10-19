import Elysia from 'elysia';
import { SitemapEntry } from '../../client/online/data';
import {
  EnumChangefreq,
  SitemapItemLoose,
  SitemapStream,
  streamToPromise,
} from 'sitemap';
import { createGzip } from 'node:zlib';
import { api } from '../../client/online/api';
import { SECURITY_HEADERS, SITE_URL } from '../config';

const lastSitemapModification = new Date('2025-11-17T03:48:59Z');

function lastMod(updatedAt: string) {
  const updatedDate = new Date(updatedAt);
  return updatedDate > lastSitemapModification
    ? updatedAt
    : lastSitemapModification.toISOString();
}

/** The Japanese counterpart of an unprefixed path. */
function jaPath(path: string): string {
  return path === '/' ? '/ja' : `/ja${path}`;
}

/**
 * Write one page together with its hreflang alternates.
 *
 * Every URL is declared in all locales it exists in (plus `x-default`, which
 * points at the unprefixed canonical form), so that the locale prefixes are
 * discovered as a language cluster rather than as unrelated pages.
 */
function writeEntry(
  stream: SitemapStream,
  path: string,
  opts: Omit<SitemapItemLoose, 'url' | 'links'>
) {
  stream.write({
    ...opts,
    url: path,
    links: [
      { lang: 'en', url: path },
      { lang: 'ja', url: jaPath(path) },
      { lang: 'x-default', url: path },
    ],
  });
}

export const sitemap = new Elysia()
  .mapResponse(({ responseValue }) => {
    return new Response(responseValue as BodyInit, {
      headers: {
        'content-type': 'text/xml',
        'content-encoding': 'gzip',
        'cache-control': 's-maxage=10, stale-while-revalidate',
        'x-robots-tag': 'index, follow',
        ...SECURITY_HEADERS,
      },
    });
  })
  .get('/sitemap.xml', async () => {
    const smStream = new SitemapStream({
      hostname: SITE_URL,
    });
    const pipeline = smStream.pipe(createGzip());

    // pipe your entries or directly write them.
    writeEntry(smStream, '/', {
      changefreq: EnumChangefreq.HOURLY,
      priority: 1,
    });
    writeEntry(smStream, '/create', {
      changefreq: EnumChangefreq.MONTHLY,
      priority: 0.4,
    });
    writeEntry(smStream, '/search/puzzles', {
      changefreq: EnumChangefreq.HOURLY,
      priority: 1,
    });
    writeEntry(smStream, '/uploader', {
      changefreq: EnumChangefreq.MONTHLY,
      priority: 0.3,
    });
    writeEntry(smStream, '/rules', {
      changefreq: EnumChangefreq.MONTHLY,
      priority: 0.2,
    });
    writeEntry(smStream, '/terms', {
      changefreq: EnumChangefreq.MONTHLY,
      priority: 0.2,
    });
    writeEntry(smStream, '/privacy-policy', {
      changefreq: EnumChangefreq.MONTHLY,
      priority: 0.2,
    });
    writeEntry(smStream, '/auth', {
      changefreq: EnumChangefreq.MONTHLY,
      priority: 0.5,
    });
    writeEntry(smStream, '/support', {
      changefreq: EnumChangefreq.MONTHLY,
      priority: 0.5,
    });

    let puzzles: SitemapEntry[] | null = null;
    let puzzleCount = 0;
    puzzlesLoop: while (puzzles === null || puzzles.length > 0) {
      puzzles = await api.listSitemap(
        'puzzles',
        undefined,
        puzzles?.at(-1)?.id
      );
      for (const puzzle of puzzles) {
        writeEntry(smStream, `/solve/${puzzle.id}`, {
          lastmod: lastMod(puzzle.updatedAt),
          changefreq: EnumChangefreq.WEEKLY,
          priority: 0.6,
        });
        puzzleCount++;
        if (puzzleCount >= 25000) break puzzlesLoop;
      }
    }

    let collections: SitemapEntry[] | null = null;
    let collectionCount = 0;
    collectionsLoop: while (collections === null || collections.length > 0) {
      collections = await api.listSitemap(
        'collections',
        undefined,
        collections?.at(-1)?.id
      );
      for (const collection of collections) {
        writeEntry(smStream, `/collection/${collection.id}`, {
          lastmod: lastMod(collection.updatedAt),
          changefreq: EnumChangefreq.WEEKLY,
          priority: 0.5,
        });
        collectionCount++;
        if (collectionCount >= 10000) break collectionsLoop;
      }
    }

    let users: SitemapEntry[] | null = null;
    let userCount = 0;
    usersLoop: while (users === null || users.length > 0) {
      users = await api.listSitemap('users', undefined, users?.at(-1)?.id);
      for (const user of users) {
        writeEntry(smStream, `/profile/${user.id}`, {
          lastmod: lastMod(user.updatedAt),
          changefreq: EnumChangefreq.WEEKLY,
          priority: 0.4,
        });
        userCount++;
        if (userCount >= 10000) break usersLoop;
      }
    }

    // make sure to attach a write stream such as streamToPromise before ending
    smStream.end();
    // collect the response into a single buffer
    return streamToPromise(pipeline);
  });
