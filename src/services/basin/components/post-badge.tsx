"use client";

import {
  ArchiveRestore,
  EarOff,
  History,
  type LucideProps,
  Scroll,
  Ticket,
  TicketCheck,
  TicketMinus,
  TicketSlash,
  TicketX,
  Volume,
  Volume1,
  Volume2,
  VolumeOff,
  VolumeX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { Badge } from "@/components/atoms/badge";

const DraftTag: React.FC = () => (
  <Badge variant="outline" size="sm">
    <Scroll className="-scale-x-100" aria-hidden="true" />
    DRAFT
  </Badge>
);

const MigratedTag: React.FC = () => (
  <Badge variant="outline" size="sm">
    <ArchiveRestore aria-hidden="true" />
    MIGRATED
  </Badge>
);

export const PostTag: React.FC<{ tag: string; otherTags: string[] }> = ({
  tag,
  otherTags,
}) => {
  const router = useRouter();
  const isReviewTag = useMemo(() => tag.endsWith("-review"), [tag]);

  return null;
};

export const PostTags: React.FC<{ tags?: string[] | undefined }> = ({
  tags,
}) => {
  if (!tags || tags.length === 0) return null;

  const renderTags = (tag: string) => {
    if (tag === "draft") return <DraftTag />;
    if (tag === "migrated") return <MigratedTag />;

    return <PostTag tag={tag} otherTags={tags.filter((t) => t !== tag)} />;
  };

  return (
    <div className="flex max-w-32 flex-wrap items-center justify-end gap-1.5 sm:max-w-48">
      {tags.map((tag) => (
        <div key={tag}>{renderTags(tag)}</div>
      ))}
    </div>
  );
};
