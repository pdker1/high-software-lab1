import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
import { Arguments } from '../Arguments.js';
export class RedoCommand implements Command {
  constructor(private readonly args: Arguments) {}
  execute(session: EditorSession): string[] { this.args.count(0); return session.redo(); }
}
