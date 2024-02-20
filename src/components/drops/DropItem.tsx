import Link from "next/link";

import type { Post } from "./types";

const DropItem: React.FC<Post> = ({
  authorUsername,
  title,
  blurb,
  publishedAt,
  slug,
}) => {
  return (
    <article>
      <Link key={slug} href={`/basin/${slug}`}>
        <h2>{title}</h2>
        <blockquote>{authorUsername}</blockquote>
        <time className="post-timestamp" dateTime={publishedAt!.toISOString()}>
          {publishedAt?.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </time>
        <p>{blurb}</p>
      </Link>
    </article>
  );
};

export default DropItem;
