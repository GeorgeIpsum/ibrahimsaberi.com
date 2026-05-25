import {
  Loader2,
  MessageCircle,
  MessageCircleDashed,
  MessageCircleHeart,
  MessageCircleWarning,
  MessageCircleX,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/css/lib";
import type { Sentiment } from "@/services/sentiment/types";
export const SentimentIcon: React.FC<{
  sentiment: Sentiment;
  loading?: boolean;
}> = ({ sentiment, loading = false }) => {
  const renderIcon = () => {
    if (!loading) {
      if (sentiment === "NEUTRAL") {
        return <MessageCircle aria-hidden="true" />;
      } else if (sentiment === "POSITIVE") {
        return <MessageCircleHeart aria-label="Aw you're sweet :)" />;
      } else if (sentiment === "NEGATIVE") {
        return (
          <MessageCircleWarning aria-label="Hmm, that doesn't sound good" />
        );
      } else if (sentiment === "UH-OH") {
        return (
          <MessageCircleX aria-label="You talk to your momma with that mouth?" />
        );
      }
    }

    return <MessageCircleDashed className="opacity-40" aria-hidden="true" />;
  };

  return (
    <motion.div className={cn("relative")}>
      <AnimatePresence mode="popLayout">
        {
          <motion.div
            className="z-1 flex cursor-help"
            key={sentiment}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {renderIcon()}
          </motion.div>
        }
      </AnimatePresence>
      <AnimatePresence>
        {loading && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
          >
            <Loader2
              className="size-2 animate-spin stroke-3"
              aria-hidden="true"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
