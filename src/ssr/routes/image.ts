import Elysia, { t } from 'elysia';
import {
  createCanvas,
  loadImage,
  SKRSContext2D,
  GlobalFonts,
  Path2D,
} from '@napi-rs/canvas';
import fontPath from '../../../public/palatino.ttf';
import { api } from '../../client/online/api';
import { PuzzleType } from '@logic-pad/core/index';

GlobalFonts.registerFromPath(fontPath, 'Palatino');

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

interface IconInfo {
  size: number;
  path: Path2D;
}

const PUZZLE_ICONS: Record<PuzzleType, IconInfo> = {
  [PuzzleType.Logic]: {
    size: 24,
    path: new Path2D(
      'M 3 15 C 3.044 14.52 3.279 13.893 3.586 13.586 C 3.893 13.279 4.52 13.044 5 13 L 9 13 C 9.481 13.044 10.108 13.279 10.415 13.586 C 10.722 13.893 10.956 14.52 11 15 L 11 19 C 10.956 19.48 10.722 20.107 10.415 20.414 C 10.108 20.721 9.481 20.956 9 21 L 5 21 C 4.52 20.956 3.893 20.721 3.586 20.414 C 3.279 20.107 3.044 19.48 3 19 Z M 5 19 L 9 19 L 9 15 L 5 15 Z M 13 15 C 13.044 14.52 13.279 13.893 13.586 13.586 C 13.893 13.279 14.52 13.044 15 13 L 19 13 C 19.481 13.044 20.108 13.279 20.415 13.586 C 20.722 13.893 20.956 14.52 21 15 L 21 19 C 20.956 19.48 20.722 20.107 20.415 20.414 C 20.108 20.721 19.481 20.956 19 21 L 15 21 C 14.52 20.956 13.893 20.721 13.586 20.414 C 13.279 20.107 13.044 19.48 13 19 Z M 15 19 L 19 19 L 19 15 L 15 15 Z M 13 5 C 13.044 4.52 13.279 3.893 13.586 3.586 C 13.893 3.279 14.52 3.044 15 3 L 19 3 C 19.481 3.044 20.108 3.279 20.415 3.586 C 20.722 3.893 20.956 4.52 21 5 L 21 9 C 20.956 9.48 20.722 10.107 20.415 10.414 C 20.108 10.721 19.481 10.956 19 11 L 15 11 C 14.52 10.956 13.893 10.721 13.586 10.414 C 13.279 10.107 13.044 9.48 13 9 Z M 15 9 L 19 9 L 19 5 L 15 5 Z M 3 5 C 3.044 4.52 3.279 3.893 3.586 3.586 C 3.893 3.279 4.52 3.044 5 3 L 9 3 C 9.481 3.044 10.108 3.279 10.415 3.586 C 10.722 3.893 10.956 4.52 11 5 L 11 9 C 10.956 9.48 10.722 10.107 10.415 10.414 C 10.108 10.721 9.481 10.956 9 11 L 5 11 C 4.52 10.956 3.893 10.721 3.586 10.414 C 3.279 10.107 3.044 9.48 3 9 Z M 5 9 L 9 9 L 9 5 L 5 5 Z'
    ),
  },
  [PuzzleType.Underclued]: {
    size: 24,
    path: new Path2D(
      'M 3 15 C 3.044 14.519 3.279 13.892 3.586 13.585 C 3.893 13.278 4.52 13.044 5 13 L 9 13 C 9.48 13.044 10.107 13.278 10.414 13.585 C 10.721 13.892 10.956 14.519 11 15 L 11 19 C 10.956 19.48 10.721 20.107 10.414 20.414 C 10.107 20.721 9.48 20.956 9 21 L 5 21 C 4.52 20.956 3.893 20.721 3.586 20.414 C 3.279 20.107 3.044 19.48 3 19 Z M 9 15 L 5 15 L 5 19 L 9 19 Z M 13 17 C 13 16.448 13.448 16 14 16 L 20 16 C 20.552 16 21 16.448 21 17 C 21 17.552 20.552 18 20 18 L 14 18 C 13.448 18 13 17.552 13 17 Z M 13 5 C 13.044 4.519 13.279 3.892 13.586 3.585 C 13.893 3.278 14.52 3.044 15 3 L 19 3 C 19.48 3.044 20.107 3.278 20.414 3.585 C 20.721 3.892 20.956 4.519 21 5 L 21 9 C 20.956 9.48 20.721 10.107 20.414 10.414 C 20.107 10.721 19.48 10.956 19 11 L 15 11 C 14.52 10.956 13.893 10.721 13.586 10.414 C 13.279 10.107 13.044 9.48 13 9 Z M 19 5 L 15 5 L 15 9 L 19 9 Z M 3 5 C 3.044 4.519 3.279 3.892 3.586 3.585 C 3.893 3.278 4.52 3.044 5 3 L 9 3 C 9.48 3.044 10.107 3.278 10.414 3.585 C 10.721 3.892 10.956 4.519 11 5 L 11 9 C 10.956 9.48 10.721 10.107 10.414 10.414 C 10.107 10.721 9.48 10.956 9 11 L 5 11 C 4.52 10.956 3.893 10.721 3.586 10.414 C 3.279 10.107 3.044 9.48 3 9 Z M 9 5 L 5 5 L 5 9 L 9 9 Z'
    ),
  },
  [PuzzleType.Music]: {
    size: 512,
    path: new Path2D(
      'M470.38 1.51L150.41 96A32 32 0 0 0 128 126.51v261.41A139 139 0 0 0 96 384c-53 0-96 28.66-96 64s43 64 96 64 96-28.66 96-64V214.32l256-75v184.61a138.4 138.4 0 0 0-32-3.93c-53 0-96 28.66-96 64s43 64 96 64 96-28.65 96-64V32a32 32 0 0 0-41.62-30.49z'
    ),
  },
  [PuzzleType.Pattern]: {
    size: 256,
    path: new Path2D(
      'M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H128V128H48V48h80v80h80v80Z'
    ),
  },
};

const COLLECTION_ICONS: Record<string, IconInfo> = {
  collection: {
    size: 512,
    path: new Path2D(
      'M48 48a48 48 0 1 0 48 48 48 48 0 0 0-48-48zm0 160a48 48 0 1 0 48 48 48 48 0 0 0-48-48zm0 160a48 48 0 1 0 48 48 48 48 0 0 0-48-48zm448 16H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zm0-320H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16V80a16 16 0 0 0-16-16zm0 160H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16z'
    ),
  },
  series: {
    size: 512,
    path: new Path2D(
      'M61.77 401l17.5-20.15a19.92 19.92 0 0 0 5.07-14.19v-3.31C84.34 356 80.5 352 73 352H16a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8h22.83a157.41 157.41 0 0 0-11 12.31l-5.61 7c-4 5.07-5.25 10.13-2.8 14.88l1.05 1.93c3 5.76 6.29 7.88 12.25 7.88h4.73c10.33 0 15.94 2.44 15.94 9.09 0 4.72-4.2 8.22-14.36 8.22a41.54 41.54 0 0 1-15.47-3.12c-6.49-3.88-11.74-3.5-15.6 3.12l-5.59 9.31c-3.72 6.13-3.19 11.72 2.63 15.94 7.71 4.69 20.38 9.44 37 9.44 34.16 0 48.5-22.75 48.5-44.12-.03-14.38-9.12-29.76-28.73-34.88zM496 224H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zm0-160H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16V80a16 16 0 0 0-16-16zm0 320H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zM16 160h64a8 8 0 0 0 8-8v-16a8 8 0 0 0-8-8H64V40a8 8 0 0 0-8-8H32a8 8 0 0 0-7.14 4.42l-8 16A8 8 0 0 0 24 64h8v64H16a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8zm-3.91 160H80a8 8 0 0 0 8-8v-16a8 8 0 0 0-8-8H41.32c3.29-10.29 48.34-18.68 48.34-56.44 0-29.06-25-39.56-44.47-39.56-21.36 0-33.8 10-40.46 18.75-4.37 5.59-3 10.84 2.8 15.37l8.58 6.88c5.61 4.56 11 2.47 16.12-2.44a13.44 13.44 0 0 1 9.46-3.84c3.33 0 9.28 1.56 9.28 8.75C51 248.19 0 257.31 0 304.59v4C0 316 5.08 320 12.09 320z'
    ),
  },
};

function drawIcon(
  icon: IconInfo,
  ctx: SKRSContext2D,
  x: number,
  y: number,
  size: number
) {
  if (!icon) return;

  ctx.save();
  ctx.resetTransform();
  ctx.translate(x, y);
  const scale = size / icon.size;
  ctx.scale(scale, scale);
  ctx.fillStyle = '#343c47';
  ctx.fillRect(0, 0, icon.size, icon.size);
  ctx.fillStyle = '#00d3bb';
  ctx.fill(icon.path);
  ctx.restore();
}

function drawPuzzleType(
  puzzleTypes: PuzzleType[],
  ctx: SKRSContext2D,
  x: number,
  y: number,
  size: number
) {
  if (puzzleTypes.length === 0) return;
  else if (puzzleTypes.length === 1) {
    drawIcon(PUZZLE_ICONS[puzzleTypes[0]], ctx, x, y, size);
  } else if (puzzleTypes.length === 2) {
    drawIcon(PUZZLE_ICONS[puzzleTypes[0]], ctx, x, y, (size / 3) * 2);
    drawIcon(
      PUZZLE_ICONS[puzzleTypes[1]],
      ctx,
      x + size / 3,
      y + size / 3,
      (size / 3) * 2
    );
  } else if (puzzleTypes.length === 3) {
    drawIcon(PUZZLE_ICONS[puzzleTypes[0]], ctx, x + size / 4, y, size / 2);
    drawIcon(PUZZLE_ICONS[puzzleTypes[1]], ctx, x, y + size / 2, size / 2);
    drawIcon(
      PUZZLE_ICONS[puzzleTypes[2]],
      ctx,
      x + size / 2,
      y + size / 2,
      size / 2
    );
  } else {
    drawIcon(PUZZLE_ICONS[puzzleTypes[0]], ctx, x, y, size / 2);
    drawIcon(PUZZLE_ICONS[puzzleTypes[1]], ctx, x + size / 2, y, size / 2);
    drawIcon(PUZZLE_ICONS[puzzleTypes[2]], ctx, x, y + size / 2, size / 2);
    drawIcon(
      PUZZLE_ICONS[puzzleTypes[3]],
      ctx,
      x + size / 2,
      y + size / 2,
      size / 2
    );
  }
}

export const image = new Elysia()
  .get(
    '/api/preview/puzzle/:puzzleId',
    async ({ params: { puzzleId }, set }) => {
      set.headers['content-type'] = 'image/png';
      set.headers['cache-control'] = 's-maxage=3600, stale-while-revalidate';

      const puzzle = await api.getPuzzleBriefForSolve(puzzleId);

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

      let flowY = margin;

      // Puzzle title
      ctx.fillStyle = '#e4e4e7';
      ctx.font = '64px Palatino';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const [titleLines, lineHeight] = getLines(
        ctx,
        puzzle.title,
        canvas.width - margin * 2 - logoSize,
        2
      );
      titleLines.forEach((line, index) => {
        ctx.fillText(line, margin, flowY + index * lineHeight);
      });
      flowY += titleLines.length * lineHeight + 36;

      // Puzzle icon
      drawPuzzleType(
        puzzle.types,
        ctx,
        canvas.width - logoSize - margin,
        margin,
        logoSize
      );

      // Author name
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = '#e4e4e7';
      ctx.font = '42px Palatino';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const { actualBoundingBoxAscent, actualBoundingBoxDescent } =
        ctx.measureText(puzzle.creator.name);
      const authorHeight = actualBoundingBoxAscent + actualBoundingBoxDescent;
      ctx.fillText(puzzle.creator.name, margin, flowY);
      flowY += authorHeight + 48;

      // Difficulty
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.translate(margin, flowY);
      const difficultyScale = 0.22;
      ctx.scale(difficultyScale, difficultyScale);
      if (puzzle.designDifficulty === 0) {
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = '#e4e4e7';
        ctx.font = '36px Palatino';
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
          path = new Path2D(
            'M100,0 A100,100 0 1,0 100,200 A100,100 0 1,0 100,0'
          );
        }
        for (let i = 0; i <= puzzle.designDifficulty % 5; i++) {
          ctx.fill(path, 'evenodd');
          ctx.translate(240, 0);
        }
      }
      ctx.resetTransform();

      // Stats
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#e4e4e7';
      ctx.font = '42px Palatino';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      let statsX = margin + 240 * 5 * difficultyScale + margin;
      let statsWidth = ctx.measureText(puzzle.solveCount.toString()).width;
      const statsY = flowY + (200 * difficultyScale) / 2;
      ctx.fillText(puzzle.solveCount.toString(), statsX, statsY);
      statsX += statsWidth + 16;
      ctx.globalAlpha = 0.75;
      ctx.font = '36px Palatino';
      const solves = puzzle.solveCount === 1 ? 'Solve' : 'Solves';
      statsWidth = ctx.measureText(solves).width;
      ctx.fillText(solves, statsX, statsY);
      statsX += statsWidth + 48;

      ctx.globalAlpha = 1;
      ctx.font = '42px Palatino';
      statsWidth = ctx.measureText(puzzle.loveCount.toString()).width;
      ctx.fillText(puzzle.loveCount.toString(), statsX, statsY);
      statsX += statsWidth + 16;
      ctx.globalAlpha = 0.75;
      ctx.font = '36px Palatino';
      const loves = puzzle.loveCount === 1 ? 'Love' : 'Loves';
      statsWidth = ctx.measureText(loves).width;
      ctx.fillText(loves, statsX, statsY);

      return canvas.toBuffer('image/png');
    },
    {
      params: t.Object({
        puzzleId: t.String({ minLength: 1, maxLength: 36 }),
      }),
    }
  )
  .get(
    '/api/preview/collection/:collectionId',
    async ({ params: { collectionId }, set }) => {
      set.headers['content-type'] = 'image/png';
      set.headers['cache-control'] = 's-maxage=3600, stale-while-revalidate';

      const collection = await api.getCollectionBrief(collectionId);

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
        'Collection',
        margin + logoSize + 16 + textWidth + 16,
        canvas.height - logoSize / 2 - margin
      );

      let flowY = margin;

      // Collection title
      ctx.fillStyle = '#e4e4e7';
      ctx.font = '64px Palatino';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const [titleLines, lineHeight] = getLines(
        ctx,
        collection.title,
        canvas.width - margin * 2 - logoSize,
        2
      );
      titleLines.forEach((line, index) => {
        ctx.fillText(line, margin, flowY + index * lineHeight);
      });
      flowY += titleLines.length * lineHeight + 36;

      // Collection icon
      drawIcon(
        COLLECTION_ICONS[collection.isSeries ? 'series' : 'collection'],
        ctx,
        canvas.width - logoSize - margin,
        margin,
        logoSize
      );

      // Author name
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = '#e4e4e7';
      ctx.font = '42px Palatino';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const { actualBoundingBoxAscent, actualBoundingBoxDescent } =
        ctx.measureText(collection.creator.name);
      const authorHeight = actualBoundingBoxAscent + actualBoundingBoxDescent;
      ctx.fillText(collection.creator.name, margin, flowY);
      flowY += authorHeight + 48;

      // Stats
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#e4e4e7';
      ctx.font = '42px Palatino';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const statsHeight = 200 * 0.22;
      let statsX = margin;
      let statsWidth = 0;
      const statsY = flowY + statsHeight / 2;
      if (collection.puzzleCount !== null) {
        statsWidth = ctx.measureText(collection.puzzleCount.toString()).width;
        ctx.fillText(collection.puzzleCount.toString(), statsX, statsY);
        statsX += statsWidth + 16;
        ctx.globalAlpha = 0.75;
        ctx.font = '36px Palatino';
        const puzzles = collection.puzzleCount === 1 ? 'Puzzle' : 'Puzzles';
        statsWidth = ctx.measureText(puzzles).width;
        ctx.fillText(puzzles, statsX, statsY);
        statsX += statsWidth + 48;
      }

      ctx.globalAlpha = 1;
      ctx.font = '42px Palatino';
      statsWidth = ctx.measureText(collection.followCount.toString()).width;
      ctx.fillText(collection.followCount.toString(), statsX, statsY);
      statsX += statsWidth + 16;
      ctx.globalAlpha = 0.75;
      ctx.font = '36px Palatino';
      const follows = collection.followCount === 1 ? 'Follow' : 'Follows';
      statsWidth = ctx.measureText(follows).width;
      ctx.fillText(follows, statsX, statsY);

      return canvas.toBuffer('image/png');
    },
    {
      params: t.Object({
        collectionId: t.String({ minLength: 1, maxLength: 36 }),
      }),
    }
  );
