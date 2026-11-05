import { MemoryFileStore } from './MemoryFileStore.js';
import { EditorSession } from '../../src/application/EditorSession.js';
import { XmlSvgCodec } from '../../src/infrastructure/XmlSvgCodec.js';
import { CommandRouter } from '../../src/cli/CommandRouter.js';
export class Fixture {
  readonly files = new MemoryFileStore();
  readonly codec = new XmlSvgCodec();
  readonly session = new EditorSession(this.files, this.codec);
  readonly router = new CommandRouter(this.session);
  run(command: string): string[] { return this.router.run(command); }
  snapshot(): string { return this.codec.encode(this.session.drawing); }
  setup(): void {
    this.run('init'); this.run('create g scene'); this.run('create g inner in scene');
    this.run('create rect a 1 2 3 4 red in inner'); this.run('create circle b 5 6 7 in inner');
    this.run('create text t 10 20 "hello world" in scene'); this.run('create line l 0 0 100 100 black');
  }
}
