import Link from "next/link";

export default async function Page() {
  const posts: any[] = [];
  return (
    <div className="mx-auto w-full sm:w-[600px] md:w-[688px] lg:w-full">
      {posts.map((p: any) => (
        <Link key={p.slug} href={`/basin/${p.slug}`}>
          {JSON.stringify(p)}
        </Link>
      ))}
    </div>
  );
}
