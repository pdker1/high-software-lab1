import { readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import type { FileStore } from '../application/ports.js';
export class LocalFileStore implements FileStore {
  read(path: string): string { try { return readFileSync(path, 'utf8'); } catch { throw new Error(`cannot read file: ${path}`); } }
  write(path: string, content: string): void {
    const temporary = `${path}.${randomUUID()}.tmp`;
    try { writeFileSync(temporary, content, { encoding: 'utf8', flag: 'wx' }); renameSync(temporary, path); }
    catch { try { unlinkSync(temporary); } catch { /* No temporary file was created. */ } throw new Error(`cannot write file: ${path}`); }
  }
}
