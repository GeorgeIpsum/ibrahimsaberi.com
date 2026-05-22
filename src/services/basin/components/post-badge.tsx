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
};

export const PostTags: React.FC<{ tags?: string[] | undefined }> = ({
  tags,
}) => {
  if (!tags || tags.length === 0) return null;

  const renderTags = (tag: string) => {
    switch (tag) {
      case "throwback":
        return (
          <Badge variant="info" size="sm">
            <History aria-hidden="true" />
            THROWBACK
          </Badge>
        );
      case "movie-review":
        return (
          <Badge variant="info" size="sm">
            <TicketCheck aria-hidden="true" />
            MOVIE REVIEW
          </Badge>
        );
      case "show-review":
        return (
          <Badge variant="info" size="sm">
            <Scroll aria-hidden="true" />
            SHOW REVIEW
          </Badge>
        );
      case "music-review":
        return (
          <Badge variant="info" size="sm">
            <Scroll aria-hidden="true" />
            MUSIC REVIEW
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex max-w-24 flex-wrap items-center justify-end gap-2 sm:max-w-48">
      {tags.map((tag) => (
        <div key={tag}>{renderTags(tag)}</div>
      ))}
    </div>
  );
};
