import type { VercelRequest, VercelResponse } from '@vercel/node';
import { api, axios } from '../client/online/api';
import {
  createCanvas,
  loadImage,
  SKRSContext2D,
  GlobalFonts,
  Path2D,
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
): [string[], number] {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];
  let height = 0;

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const { width, actualBoundingBoxAscent, actualBoundingBoxDescent } =
      ctx.measureText(currentLine + ' ' + word);
    height = actualBoundingBoxAscent + actualBoundingBoxDescent;
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
  return [lines, height];
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
  const margin = 84;
  ctx.drawImage(
    logo,
    margin,
    canvas.height - logoSize - margin,
    logoSize,
    logoSize
  );
  ctx.fillStyle = '#00d3bb';
  ctx.font = '48px Palatino';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    'Logic Pad',
    margin + logoSize + 16,
    canvas.height - logoSize / 2 - margin
  );
  const textWidth = ctx.measureText('Logic Pad').width;
  ctx.fillStyle = '#e4e4e7';
  ctx.fillText(
    'Puzzle',
    margin + logoSize + 16 + textWidth + 16,
    canvas.height - logoSize / 2 - margin
  );

  // Puzzle title
  ctx.fillStyle = '#e4e4e7';
  ctx.font = '64px Palatino';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const [titleLines, lineHeight] = getLines(
    ctx,
    puzzle.title,
    canvas.width - margin * 2,
    2
  );
  titleLines.forEach((line, index) => {
    ctx.fillText(line, margin, margin + index * lineHeight);
  });

  // Author name
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = '#e4e4e7';
  ctx.font = '36px Palatino';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const { actualBoundingBoxAscent, actualBoundingBoxDescent } = ctx.measureText(
    puzzle.creator.name
  );
  const authorHeight = actualBoundingBoxAscent + actualBoundingBoxDescent;
  ctx.fillText(
    puzzle.creator.name,
    margin,
    margin + titleLines.length * lineHeight + 24
  );

  // Difficulty
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.translate(
    margin,
    margin + titleLines.length * lineHeight + 24 + authorHeight + 32
  );
  ctx.scale(0.25, 0.25);
  if (puzzle.designDifficulty === 0) {
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = '#e4e4e7';
    ctx.fillText('Unrated', 0, 0);
  } else {
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#00d3bb';
    let path: Path2D;
    if (puzzle.designDifficulty > 5) {
      path = new Path2D(
        'm96 153.044-58.779 26.243 7.02-63.513L.894 68.481l63.117-13.01L96 0l31.989 55.472 63.117 13.01-43.347 47.292 7.02 63.513z'
      );
    } else {
      path = new Path2D('M100,0 A100,100 0 1,0 100,200 A100,100 0 1,0 100,0');
    }
    for (let i = 0; i <= puzzle.designDifficulty % 5; i++) {
      ctx.fill(path, 'evenodd');
      ctx.translate(200, 0);
    }
  }
  ctx.resetTransform();

  const buffer = canvas.toBuffer('image/png');
  response.status(200).send(buffer);
}
