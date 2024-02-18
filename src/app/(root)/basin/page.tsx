import Link from "next/link";

import getDrop from "./drop";

export default async function Page() {
  const res = await getDrop();
  const { posts } = await res.json();
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
