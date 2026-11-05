import { EditCommand } from '../EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { Drawing } from '../../domain/Drawing.js';
export class ScaleCommand extends EditCommand {
  constructor(private readonly args: Arguments) { super(); }
  protected override apply(drawing: Drawing): string { this.args.count(2); const shape = drawing.find(this.args.at(0)), factor = this.args.number(1); shape.scale(factor); return `${shape.label} scaled by ${factor}`; }
}
