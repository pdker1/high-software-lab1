import type { Command } from './Command.js';
import type { EditorSession } from './EditorSession.js';
import type { Drawing } from '../domain/Drawing.js';
export abstract class EditCommand implements Command {
  private before?: Drawing;
  private after?: Drawing;
  private result = '';
  protected abstract apply(drawing: Drawing): string;
  execute(session: EditorSession): string[] {
    const before = session.drawing.clone(), candidate = before.clone();
    const result = this.apply(candidate);
    this.before = before; this.after = candidate.clone(); this.result = result;
    session.replace(candidate);
    return [result];
  }
  undo(session: EditorSession): string[] { session.replace(this.before!.clone()); return [`undone: ${this.result}`]; }
  redo(session: EditorSession): string[] { session.replace(this.after!.clone()); return [`redone: ${this.result}`]; }
}
