import type { VercelRequest, VercelResponse } from '@vercel/node';
import { api, axios } from '../client/online/api';
import {
  createCanvas,
  loadImage,
  SKRSContext2D,
  GlobalFonts,
} from '@napi-rs/canvas';
import fontPath from '../../public/palatino.ttf';

GlobalFonts.registerFromPath(fontPath, 'Palatino');

// TODO: A dirty hack to get around import.meta.env being undefined in vite-plugin-vercel v9
axios.defaults.baseURL = process.env.VITE_API_ENDPOINT;

const urlRegex = /^\/api\/preview\/([^/]+)\/([^/]+)/;

function getLines(
  ctx: SKRSContext2D,
  text: string,
  maxWidth: number,
  maxLines: number = Infinity
): string[] {
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

  if (lines.length > maxLines) {
    lines.splice(maxLines, lines.length - maxLines);
    lines[maxLines - 1] =
      lines[maxLines - 1].substring(0, lines[maxLines - 1].length - 3) + '...';
  }
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
  ctx.fillStyle = '#e4e4e7';
  ctx.font = '64px Palatino';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const titleLines = getLines(ctx, puzzle.title, canvas.width - 64 * 2, 2);
  const lineHeight = 70;
  titleLines.forEach((line, index) => {
    ctx.fillText(line, 64, 64 + index * lineHeight);
  });

  // Logo
  const buffer = canvas.toBuffer('image/png');
  response.status(200).send(buffer);
  ctx.fillStyle = '#00d3bb';
  ctx.font = '32px Palatino';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    'Logic Pad',
    64 + logoSize + 64,
    canvas.height - logoSize / 2 - 64
  );
  const textWidth = ctx.measureText('Logic Pad').width;
  ctx.fillStyle = '#e4e4e7';
  ctx.fillText(
    'Puzzle',
    64 + logoSize + 64 + textWidth + 16,
    canvas.height - logoSize / 2 - 64
  );
}
