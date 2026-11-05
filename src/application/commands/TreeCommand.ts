import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
import { Arguments } from '../Arguments.js';
import { DrawingFormatter } from '../DrawingFormatter.js';
export class TreeCommand implements Command {
  constructor(private readonly args: Arguments) {}
  execute(session: EditorSession): string[] { this.args.count(0, 1); return new DrawingFormatter().tree(session.drawing, this.args.all[0]); }
}
