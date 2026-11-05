import type { Drawing } from '../domain/Drawing.js';
export interface FileStore { read(path: string): string; write(path: string, content: string): void; }
export interface SvgCodec { decode(xml: string): { drawing: Drawing; warnings: string[] }; encode(drawing: Drawing): string; }
