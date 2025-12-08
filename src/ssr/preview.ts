import type { VercelRequest, VercelResponse } from '@vercel/node';
import { api, axios } from '../client/online/api';
import { createCanvas, loadImage, SKRSContext2D } from '@napi-rs/canvas';

// TODO: A dirty hack to get around import.meta.env being undefined in vite-plugin-vercel v9
axios.defaults.baseURL = process.env.VITE_API_ENDPOINT;

const urlRegex = /^\/api\/preview\/([^/]+)\/([^/]+)/;

function getLines(ctx: SKRSContext2D, text: string, maxWidth: number) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

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
    response.status(404).send('Not Found');
    return;
  }
  response.setHeader('Content-Type', 'image/png');
  response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  const puzzle = await api.getPuzzleBriefForSolve(resourceId);

  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#343c47';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Site logo
  const logo = await loadImage(
    `https://${process.env.VERCEL_URL}/pwa-512x512.png`
  );
  const logoSize = 128;
  ctx.drawImage(logo, 64, canvas.height - logoSize - 64, logoSize, logoSize);

  // Puzzle title
  ctx.fillStyle = 'white';
  ctx.font = 'bold 64pt Sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const titleLines = getLines(ctx, puzzle.title, canvas.width - 256 - 64);

  const lineHeight = 80;
  const titleYStart =
    canvas.height / 2 - ((titleLines.length - 1) * lineHeight) / 2;
  titleLines.forEach((line, index) => {
    ctx.fillText(line, canvas.width - 64, titleYStart + index * lineHeight);
  });

  const buffer = canvas.toBuffer('image/png');
  response.status(200).send(buffer);
}
