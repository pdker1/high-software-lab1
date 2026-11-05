/** Quotes preserve whitespace; # starts a comment only at the beginning of a line. */
export class Lexer {
  tokenize(line: string): string[] {
    if (!line.trim() || line.trimStart().startsWith('#')) return [];
    const tokens: string[] = [];
    let value = '', quoted = false, started = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i]!;
      if (char === '\\' && quoted && ['"', '\\'].includes(line[i + 1] ?? '')) { value += line[++i]!; started = true; }
      else if (char === '"') { quoted = !quoted; started = true; }
      else if (/\s/.test(char) && !quoted) { if (started) tokens.push(value); value = ''; started = false; }
      else { value += char; started = true; }
    }
    if (quoted) throw new Error('unterminated quoted argument');
    if (started) tokens.push(value);
    return tokens;
  }
}
