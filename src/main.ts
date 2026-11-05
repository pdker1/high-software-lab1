import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { EditorSession } from './application/EditorSession.js';
import { CommandRouter } from './cli/CommandRouter.js';
import { Repl } from './cli/Repl.js';
import { LocalFileStore } from './infrastructure/LocalFileStore.js';
import { XmlSvgCodec } from './infrastructure/XmlSvgCodec.js';
const session = new EditorSession(new LocalFileStore(), new XmlSvgCodec());
await new Repl(new CommandRouter(session)).start(createInterface({ input: stdin, terminal: Boolean(stdin.isTTY), crlfDelay: Infinity }), stdout, Boolean(stdin.isTTY));
