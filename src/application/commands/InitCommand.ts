import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
import { Arguments } from '../Arguments.js';
import { Drawing } from '../../domain/Drawing.js';
export class InitCommand implements Command {
  constructor(private readonly args: Arguments) {}
  execute(session: EditorSession): string[] { this.args.count(0, 2); const drawing = new Drawing(this.args.all[0] === undefined ? 800 : this.args.number(0), this.args.all[1] === undefined ? 600 : this.args.number(1)); session.initialize(drawing); return [`canvas ${drawing.width}x${drawing.height} created`]; }
}
