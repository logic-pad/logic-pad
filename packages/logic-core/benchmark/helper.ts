import { Puzzle } from '../src/data/puzzle.js';
import { Serializer } from '../src/data/serializer/allSerializers.js';
import { encode, decode } from 'uint8-to-base64';
import CompressorBase from '../src/data/serializer/compressor/compressorBase.js';

const decoder = new TextDecoder();
const encoder = new TextEncoder();

class BunCompressor extends CompressorBase {
  get id(): string {
    return 'dfl';
  }

  compress(input: string): Promise<string> {
    const data = Bun.deflateSync(encoder.encode(input), {
      library: 'libdeflate',
      level: 12,
    });
    return Promise.resolve(
      `${this.id}_${encode(data).replace(/\+/g, '-').replace(/\//g, '_')}`
    );
  }

  decompress(input: string): Promise<string> {
    const data = decode(
      input.replace(`${this.id}_`, '').replace(/-/g, '+').replace(/_/g, '/')
    ) as Uint8Array<ArrayBuffer>;
    const result = Bun.inflateSync(data, {
      library: 'libdeflate',
      level: 12,
    });
    return Promise.resolve(decoder.decode(result));
  }
}

export const bunCompressor = new BunCompressor();

export interface PuzzleEntry {
  pid: number;
  difficulty: number;
  puzzleLink: string;
}

export interface BenchmarkEntry {
  pid: number;
  supported: boolean;
  solveTime: number;
  solveCorrect: boolean;
}

export async function parseLink(link: string): Promise<Puzzle> {
  const url = new URL(link);
  const data = url.searchParams.get('d');
  if (data === null) {
    throw new Error('Missing data parameter');
  }
  return Serializer.parsePuzzle(await bunCompressor.decompress(data));
}
