import { EditCommand } from '../EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { Drawing } from '../../domain/Drawing.js';
import { ShapeFactory } from '../../domain/ShapeFactory.js';
export class CreateCommand extends EditCommand {
  constructor(private readonly args: Arguments) { super(); }
  protected override apply(drawing: Drawing): string { const args = [...this.args.all]; if (args.length < 2) throw new Error('create requires type and id');
    let parent: string | undefined;
    if (args.length >= 4 && args.at(-2) === 'in') { parent = args.pop()!; args.pop(); }
    const shape = new ShapeFactory().create(args[0]!, args[1]!, args.slice(2));
    drawing.add(shape, parent); return `${shape.label} created${parent === undefined ? '' : ' in g#' + parent}`; }
}
