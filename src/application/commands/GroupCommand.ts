import { EditCommand } from '../EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { Drawing } from '../../domain/Drawing.js';
export class GroupCommand extends EditCommand {
  constructor(private readonly args: Arguments) { super(); }
  protected override apply(drawing: Drawing): string { this.args.count(2, Number.MAX_SAFE_INTEGER); return drawing.group(this.args.at(0), this.args.all.slice(1)); }
}
