import type { FileStore } from '../../src/application/ports.js';
export class MemoryFileStore implements FileStore {
  private readonly files = new Map<string, string>();
  private writable = true;
  put(path: string, content: string): void { this.files.set(path, content); }
  denyWrites(): void { this.writable = false; }
  read(path: string): string { const value = this.files.get(path); if (value === undefined) throw new Error(`cannot read file: ${path}`); return value; }
  write(path: string, content: string): void { if (!this.writable) throw new Error(`cannot write file: ${path}`); this.files.set(path, content); }
}
