import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
import { Arguments } from '../Arguments.js';
export class CanvasCommand implements Command {
  constructor(private readonly args: Arguments) {}
  execute(session: EditorSession): string[] { void session.drawing; if (this.args.all.length === 0) return [`canvas ${session.drawing.width}x${session.drawing.height}`]; this.args.count(2); session.resize(this.args.number(0), this.args.number(1)); return [`canvas resized to ${session.drawing.width}x${session.drawing.height}`]; }
}
