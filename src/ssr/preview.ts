import type { VercelRequest, VercelResponse } from '@vercel/node';
import { api, axios } from '../client/online/api';
import { createCanvas, loadImage } from '@napi-rs/canvas';

// TODO: A dirty hack to get around import.meta.env being undefined in vite-plugin-vercel v9
axios.defaults.baseURL = process.env.VITE_API_ENDPOINT;

const urlRegex = /^\/api\/preview\/([^/]+)\/([^/]+)/;

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (!request.url) {
    response.status(404).send('Not Found');
    return;
  }
  const match = request.url.match(urlRegex);
  if (!match) {
    response.status(404).send('Not Found');
    return;
  }
  const [, type, resourceId] = match;

  if (
    type !== 'puzzle' ||
    typeof resourceId !== 'string' ||
    resourceId.length === 0
  ) {
    response.status(400).send('Bad Request');
    return;
  }
  response.setHeader('Content-Type', 'text/xml');
  response.setHeader('Content-Encoding', 'gzip');
  response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  const puzzle = await api.getPuzzleBriefForSolve(resourceId);

  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = 'oklch(0.35325 0.02201 256.39)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Site logo
  const logo = await loadImage(
    `https://${process.env.VERCEL_URL}/pwa-512x512.png`
  );
  const logoSize = 128;
  ctx.drawImage(logo, 64, canvas.height - logoSize - 64, logoSize, logoSize);

  // Puzzle title
  ctx.fillStyle = 'black';
  ctx.font = 'bold 64pt Sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const title =
    puzzle.title.length > 30 ? puzzle.title.slice(0, 27) + '...' : puzzle.title;
  ctx.fillText(title, canvas.width - 64, canvas.height / 2);

  const buffer = canvas.toBuffer('image/png');
  response.status(200).send(buffer);
}
