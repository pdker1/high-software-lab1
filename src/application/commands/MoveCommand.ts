import { EditCommand } from '../EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { Drawing } from '../../domain/Drawing.js';
export class MoveCommand extends EditCommand {
  constructor(private readonly args: Arguments) { super(); }
  protected override apply(drawing: Drawing): string { this.args.count(3); const shape = drawing.find(this.args.at(0)), dx = this.args.number(1), dy = this.args.number(2);
    shape.move(dx, dy); return `${shape.label} moved by (${dx},${dy})`; }
}
