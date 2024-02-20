export default function Layout({ children }: { children: JSX.Element }) {
  return (
    <article className="rounded-lg bg-white/30 px-4 pb-14 pt-8 shadow-lg shadow-fuchsia-700/10 backdrop-blur-lg dark:bg-black/30 dark:shadow-green-500/10 md:px-6 md:pb-20 md:pt-12">
      {children}
    </article>
  );
}
