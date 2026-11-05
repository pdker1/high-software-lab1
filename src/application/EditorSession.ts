import type { Drawing } from '../domain/Drawing.js';
import type { Command } from './Command.js';
import { EditCommand } from './EditCommand.js';
import { CommandHistory } from './CommandHistory.js';
import type { FileStore, SvgCodec } from './ports.js';
export class EditorSession {
  private current?: Drawing;
  private filePath?: string;
  private readonly history = new CommandHistory();
  constructor(private readonly files: FileStore, private readonly codec: SvgCodec) {}
  get drawing(): Drawing { if (!this.current) throw new Error("no document. use 'init' or 'read' first"); return this.current; }
  replace(drawing: Drawing): void { this.current = drawing; }
  execute(command: Command): string[] { return command instanceof EditCommand ? this.history.execute(command, this) : command.execute(this); }
  initialize(drawing: Drawing): void { this.current = drawing; this.filePath = undefined; this.history.barrier(); }
  read(path: string): string[] {
    const decoded = this.codec.decode(this.files.read(path));
    this.current = decoded.drawing; this.filePath = path; this.history.barrier();
    return [...decoded.warnings, `read ${path} (${this.drawing.all().length} elements)`];
  }
  save(path?: string): string[] {
    const drawing = this.drawing, target = path ?? this.filePath;
    if (!target) throw new Error('no file path. use save <file.svg>');
    this.files.write(target, this.codec.encode(drawing));
    this.filePath = target; this.history.barrier();
    return [`saved to ${target} (${drawing.all().length} elements)`];
  }
  resize(w: number, h: number): void { const copy = this.drawing.clone(); copy.resize(w, h); this.current = copy; this.history.barrier(); }
  undo(): string[] { void this.drawing; return this.history.undo(this); }
  redo(): string[] { void this.drawing; return this.history.redo(this); }
}
