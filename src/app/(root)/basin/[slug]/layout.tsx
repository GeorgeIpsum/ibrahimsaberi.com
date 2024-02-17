export default function Layout({ children }: { children: JSX.Element }) {
  return (
    <article className="rounded-lg bg-white/30 p-1 shadow-lg shadow-fuchsia-700/10 backdrop-blur-lg dark:bg-black/30 dark:shadow-green-500/10">
      {children}
    </article>
  );
}
