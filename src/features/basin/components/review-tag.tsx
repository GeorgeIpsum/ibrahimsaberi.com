import { useCallback, useMemo } from "react";

export const ReviewTag: React.FC<{ tag: string; otherTags: string[] }> = ({
  tag,
  otherTags,
}) => {
  const _verdict = useMemo(() => {
    const verdict = otherTags.find((t) => t.startsWith("verdict-"));
    if (!verdict) return null;
    return verdict.replace("verdict-", "");
  }, [otherTags]);

  const _IconComponent = useCallback(() => {
    const _reviewType = tag.replace("-review", "");
  }, [tag]);

  return null;
};
