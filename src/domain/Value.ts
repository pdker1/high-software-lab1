export class Value {
  static number(raw: string | number): number {
    if (typeof raw === 'string' && !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)) {
      throw new Error(`invalid number: ${raw}`);
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) throw new Error(`invalid number: ${raw}`);
    return Object.is(n, -0) ? 0 : n;
  }
  static positive(raw: string | number, label: string): number {
    const n = this.number(raw);
    if (n <= 0) throw new Error(`${label} must be positive`);
    return n;
  }
  static id(id: string): string {
    if (!id || /\s/.test(id)) throw new Error(`invalid id: ${id}`);
    return id;
  }
}
