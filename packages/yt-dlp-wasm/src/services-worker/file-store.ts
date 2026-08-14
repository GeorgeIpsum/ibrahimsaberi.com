/** In-memory staging store for files crossing the bridge (offset writes, ranged reads). */
export class FileStore {
  private readonly files = new Map<string, Uint8Array>();

  put(name: string, offset: number, body: Uint8Array): void {
    const existing = this.files.get(name);
    const end = offset + body.length;
    if (!existing || existing.length < end) {
      const grown = new Uint8Array(Math.max(end, existing?.length ?? 0));
      if (existing) grown.set(existing, 0);
      grown.set(body, offset);
      this.files.set(name, grown);
    } else {
      existing.set(body, offset);
    }
  }

  stat(name: string): number {
    const f = this.files.get(name);
    if (!f) throw new Error(`no such file: ${name}`);
    return f.length;
  }

  get(
    name: string,
    offset: number,
    len: number,
  ): { body: Uint8Array; eof: boolean } {
    const f = this.files.get(name);
    if (!f) throw new Error(`no such file: ${name}`);
    const end = Math.min(offset + len, f.length);
    return { body: f.slice(offset, end), eof: end >= f.length };
  }

  delete(name: string): void {
    this.files.delete(name);
  }
  has(name: string): boolean {
    return this.files.has(name);
  }
  set(name: string, data: Uint8Array): void {
    this.files.set(name, data);
  }
  raw(name: string): Uint8Array | undefined {
    return this.files.get(name);
  }
}
