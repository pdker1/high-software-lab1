import { EditCommand } from '../EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { Drawing } from '../../domain/Drawing.js';
export class FrontCommand extends EditCommand {
  constructor(private readonly args: Arguments) { super(); }
  protected override apply(drawing: Drawing): string { this.args.count(1); return drawing.reorder(this.args.at(0), true); }
}
