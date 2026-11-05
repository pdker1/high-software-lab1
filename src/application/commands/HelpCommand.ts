import type { Command } from '../Command.js';
import { Arguments } from '../Arguments.js';
export class HelpCommand implements Command {
  constructor(private readonly args: Arguments, private readonly lines: () => string[]) {}
  execute(): string[] { this.args.count(0); return this.lines(); }
}
