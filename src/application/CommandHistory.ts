import type { EditCommand } from './EditCommand.js';
import type { EditorSession } from './EditorSession.js';
export class CommandHistory {
  private undoStack: EditCommand[] = [];
  private redoStack: EditCommand[] = [];
  private blocked = true;
  barrier(): void { this.undoStack = []; this.redoStack = []; this.blocked = true; }
  execute(command: EditCommand, session: EditorSession): string[] {
    const output = command.execute(session);
    this.undoStack.push(command); this.redoStack = []; this.blocked = false;
    return output;
  }
  undo(session: EditorSession): string[] {
    if (this.blocked) throw new Error('undo not allowed after io command');
    const command = this.undoStack.at(-1); if (!command) throw new Error('nothing to undo');
    const output = command.undo(session); this.undoStack.pop(); this.redoStack.push(command); return output;
  }
  redo(session: EditorSession): string[] {
    if (this.blocked) throw new Error('undo not allowed after io command');
    const command = this.redoStack.at(-1); if (!command) throw new Error('nothing to redo');
    const output = command.redo(session); this.redoStack.pop(); this.undoStack.push(command); return output;
  }
}
