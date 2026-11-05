import type { Command } from '../Command.js';
import type { EditorSession } from '../EditorSession.js';
import { Arguments } from '../Arguments.js';
export class ReadCommand implements Command {
  constructor(private readonly args: Arguments) {}
  execute(session: EditorSession): string[] { this.args.count(1); return session.read(this.args.at(0)); }
}
