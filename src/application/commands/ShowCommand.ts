import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
import { Arguments } from '../Arguments.js';
import { DrawingFormatter } from '../DrawingFormatter.js';
export class ShowCommand implements Command {
  constructor(private readonly args: Arguments) {}
  execute(session: EditorSession): string[] { this.args.count(1); return new DrawingFormatter().show(session.drawing, this.args.at(0)); }
}
