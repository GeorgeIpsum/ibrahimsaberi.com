"use client";

import { ArchiveRestore, Code, Scroll } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/atoms/badge";
import { ReviewTag } from "./review-tag";

const DraftTag: React.FC = () => (
  <Badge className="ml-1" variant="outline" size="sm">
    <Scroll className="-scale-x-100" aria-hidden="true" />
    DRAFT
  </Badge>
);

const MigratedTag: React.FC = () => (
  <Badge className="ml-1" variant="outline" size="sm">
    <ArchiveRestore aria-hidden="true" />
    MIGRATED
  </Badge>
);

const CodeTag: React.FC = () => {
  return (
    <Badge className="ml-1 cursor-wait" variant="default" size="sm">
      <Code aria-hidden="true" />
      <code className="font-mono text-[10px]">CODE</code>
    </Badge>
  );
};

const codeTags = ["code", "esm", "python", "rust", "go", "k8s"];

// we have a few first class tags that we recognize and add to `PostListItem`s
export const PostTag: React.FC<{ tag: string; otherTags: string[] }> = ({
  tag,
  otherTags,
}) => {
  const isReviewTag = useMemo(() => tag.endsWith("-review"), [tag]);
  const isCodeTag = useMemo(() => {
    if (tag === "code") return true;
    // if the tag is the FIRST code tag out of all the tags, we treat it as a code tag, subsequent code related tags are not considered
    const firstCodeTag = otherTags.find((t) => codeTags.includes(t));
    return tag === firstCodeTag;
  }, [tag, otherTags]);

  if (isReviewTag) {
    return <ReviewTag tag={tag} otherTags={otherTags} />;
  } else if (isCodeTag) {
    return <CodeTag />;
  }

  return null;
};

export const PostTags: React.FC<{ tags?: string[] | undefined }> = ({
  tags,
}) => {
  if (!tags || tags.length === 0) return null;

  const renderTags = (tag: string) => {
    if (tag === "draft") return <DraftTag />;
    if (tag === "migrated") return <MigratedTag />;

    return <PostTag tag={tag} otherTags={tags} />;
  };

  return (
    <div className="flex max-w-32 flex-wrap items-center justify-end sm:max-w-48">
      {tags.map((tag) => (
        <div key={tag}>{renderTags(tag)}</div>
      ))}
    </div>
  );
};
