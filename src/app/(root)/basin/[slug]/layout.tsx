export default function Layout({ children }: { children: JSX.Element }) {
  return (
    <article className="rounded-lg bg-white/30 px-4 pb-14 pt-4 shadow-lg backdrop-blur-lg dark:bg-black/50 md:px-6 md:pb-20 md:pt-12">
      {children}
    </article>
  );
}
