import type { Interface } from 'node:readline/promises';
import type { Writable } from 'node:stream';
import { CommandRouter } from './CommandRouter.js';
export class Repl {
  constructor(private readonly router: CommandRouter) {}
  async start(input: Interface, output: Writable, interactive: boolean): Promise<void> {
    output.write("svg-editor 0.1 — type 'help' for commands\n");
    if (interactive) { input.setPrompt('svg> '); input.prompt(); }
    for await (const line of input) {
      for (const result of this.router.run(line)) output.write(result + '\n');
      if (interactive) input.prompt();
    }
  }
}
