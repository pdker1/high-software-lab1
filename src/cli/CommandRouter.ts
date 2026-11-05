import type { Command } from '../application/Command.js';
import { Arguments } from '../application/Arguments.js';
import { EditorSession } from '../application/EditorSession.js';
import { Lexer } from './Lexer.js';
import { InitCommand } from '../application/commands/InitCommand.js';
import { ReadCommand } from '../application/commands/ReadCommand.js';
import { SaveCommand } from '../application/commands/SaveCommand.js';
import { CanvasCommand } from '../application/commands/CanvasCommand.js';
import { CreateCommand } from '../application/commands/CreateCommand.js';
import { DeleteCommand } from '../application/commands/DeleteCommand.js';
import { MoveCommand } from '../application/commands/MoveCommand.js';
import { ScaleCommand } from '../application/commands/ScaleCommand.js';
import { SetCommand } from '../application/commands/SetCommand.js';
import { GroupCommand } from '../application/commands/GroupCommand.js';
import { UngroupCommand } from '../application/commands/UngroupCommand.js';
import { AddToCommand } from '../application/commands/AddToCommand.js';
import { FrontCommand } from '../application/commands/FrontCommand.js';
import { BackCommand } from '../application/commands/BackCommand.js';
import { TreeCommand } from '../application/commands/TreeCommand.js';
import { ShowCommand } from '../application/commands/ShowCommand.js';
import { UndoCommand } from '../application/commands/UndoCommand.js';
import { RedoCommand } from '../application/commands/RedoCommand.js';
import { HelpCommand } from '../application/commands/HelpCommand.js';
/** Only command-name dispatch point; convert to registry for extensions in phase 2. */
export class CommandRouter {
  private readonly lexer = new Lexer();
  private readonly commands = new Map<string, { syntax: string; make: (args: Arguments) => Command }>([
    ['init', { syntax: 'init [w] [h]', make: args => new InitCommand(args) }],
    ['read', { syntax: 'read <file.svg>', make: args => new ReadCommand(args) }],
    ['save', { syntax: 'save [file.svg]', make: args => new SaveCommand(args) }],
    ['canvas', { syntax: 'canvas [w h]', make: args => new CanvasCommand(args) }],
    ['create', { syntax: 'create <type> <id> [params...] [in <containerId>]', make: args => new CreateCommand(args) }],
    ['delete', { syntax: 'delete <id>', make: args => new DeleteCommand(args) }],
    ['move', { syntax: 'move <id> <dx> <dy>', make: args => new MoveCommand(args) }],
    ['scale', { syntax: 'scale <id> <factor>', make: args => new ScaleCommand(args) }],
    ['set', { syntax: 'set <id> <attr> <value>', make: args => new SetCommand(args) }],
    ['group', { syntax: 'group <newGid> <id1> [id2...]', make: args => new GroupCommand(args) }],
    ['ungroup', { syntax: 'ungroup <gid>', make: args => new UngroupCommand(args) }],
    ['addto', { syntax: 'addto <gid> <id>', make: args => new AddToCommand(args) }],
    ['front', { syntax: 'front <id>', make: args => new FrontCommand(args) }],
    ['back', { syntax: 'back <id>', make: args => new BackCommand(args) }],
    ['tree', { syntax: 'tree [id]', make: args => new TreeCommand(args) }],
    ['show', { syntax: 'show <id>', make: args => new ShowCommand(args) }],
    ['undo', { syntax: 'undo', make: args => new UndoCommand(args) }],
    ['redo', { syntax: 'redo', make: args => new RedoCommand(args) }],
    ['help', { syntax: 'help', make: args => new HelpCommand(args, () => this.help()) }],
  ]);
  constructor(private readonly session: EditorSession) {}
  run(line: string): string[] {
    try {
      const tokens = this.lexer.tokenize(line); if (tokens.length === 0) return [];
      const name = tokens[0]!, args = new Arguments(tokens.slice(1));
      const definition = this.commands.get(name);
      if (!definition) throw new Error(`unknown command: ${name}`);
      return this.session.execute(definition.make(args));
    } catch (error) {
      return ['error: ' + (error instanceof Error ? error.message : String(error)).replace(/[\r\n]+/g, ' ')];
    }
  }
  help(): string[] { return [...this.commands.values()].map(entry => entry.syntax); }
}
