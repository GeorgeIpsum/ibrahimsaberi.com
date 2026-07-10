// Browser stand-in for `next/server` — only what src/components/text/hello.tsx
// imports. `connection()` just signals "dynamic render"; resolving immediately
// is the correct client-side semantic.
export async function connection(): Promise<void> {}
