import { EditCommand } from '../EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { Drawing } from '../../domain/Drawing.js';
export class SetCommand extends EditCommand {
  constructor(private readonly args: Arguments) { super(); }
  protected override apply(drawing: Drawing): string { this.args.count(3); const shape = drawing.find(this.args.at(0)); shape.set(this.args.at(1), this.args.at(2)); return `${shape.label} updated: ${this.args.at(1)}=${JSON.stringify(this.args.at(2))}`; }
}
