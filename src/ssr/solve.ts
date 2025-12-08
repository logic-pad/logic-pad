import indexHtml from '../../dist/index.html';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { api, axios } from '../client/online/api';
import { isbot } from 'isbot';

// TODO: A dirty hack to get around import.meta.env being undefined in vite-plugin-vercel v9
axios.defaults.baseURL = process.env.VITE_API_ENDPOINT;

const urlRegex = /^\/solve\/([^/]+)/;

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  response.setHeader('Content-Type', 'text/html');
  response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  if (!request.headers['user-agent'] || isbot(request.headers['user-agent'])) {
    response.send(indexHtml);
    return;
  }

  if (!request.url) {
    response.send(indexHtml);
    return;
  }
  const match = request.url.match(urlRegex);
  if (!match) {
    response.send(indexHtml);
    return;
  }
  const [, puzzleId] = match;
  if (typeof puzzleId !== 'string' || puzzleId.length === 0) {
    response.send(indexHtml);
    return;
  }

  const puzzle = await api.getPuzzleBriefForSolve(puzzleId);
  if (!puzzle) {
    response.send(indexHtml);
    return;
  }

  const customizedHtml = indexHtml
    .replace(/Logic Pad/g, `${puzzle.title} - Logic Pad`)
    .replace(
      /A modern, open-source web app for grid-based puzzles\./g,
      `A puzzle by ${puzzle.creator.name} on Logic Pad.`
    )
    .replace(
      /\/pwa-512x512.png/g,
      `https://${process.env.VERCEL_URL}/api/preview/puzzle/${puzzle.id}`
    );
  response.send(customizedHtml);
}
