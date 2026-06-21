type Listener<T> = (data: T) => void;

/** Minimal typed multi-channel event emitter. */
export class Emitter<E extends Record<string, unknown>> {
  private readonly channels = new Map<keyof E, Set<Listener<unknown>>>();

  on<K extends keyof E>(channel: K, cb: Listener<E[K]>): void {
    let set = this.channels.get(channel);
    if (!set) {
      set = new Set();
      this.channels.set(channel, set);
    }
    set.add(cb as Listener<unknown>);
  }

  off<K extends keyof E>(channel: K, cb: Listener<E[K]>): void {
    this.channels.get(channel)?.delete(cb as Listener<unknown>);
  }

  emit<K extends keyof E>(channel: K, data: E[K]): void {
    for (const cb of [...(this.channels.get(channel) ?? [])]) {
      try {
        (cb as Listener<E[K]>)(data);
      } catch {
        // a throwing listener must not break delivery to the others
      }
    }
  }
}
