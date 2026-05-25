import {
  Loader2,
  MessageCircle,
  MessageCircleDashed,
  MessageCircleHeart,
  MessageCircleWarning,
  MessageCircleX,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Sentiment } from "@/services/sentiment/types";
export const SentimentIcon: React.FC<{
  sentiment: Sentiment;
  loading?: boolean;
}> = ({ sentiment, loading = false }) => {
  const renderIcon = () => {
    if (sentiment === "NEUTRAL") {
      return <MessageCircle aria-hidden="true" />;
    } else if (sentiment === "POSITIVE") {
      return <MessageCircleHeart aria-label="Aw you're sweet :)" />;
    } else if (sentiment === "NEGATIVE") {
      return <MessageCircleWarning aria-label="Hmm, that doesn't sound good" />;
    } else if (sentiment === "UH-OH") {
      return (
        <MessageCircleX aria-label="You talk to your momma with that mouth?" />
      );
    }

    return <MessageCircleDashed className="opacity-10" aria-hidden="true" />;
  };

  return (
    <motion.div className="relative size-3">
      <AnimatePresence mode="popLayout">
        {!loading && sentiment && (
          <motion.div
            className="flex cursor-help"
            key={sentiment}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {renderIcon()}
          </motion.div>
        )}
      </AnimatePresence>
      <MessageCircleDashed
        className="absolute inset-0 cursor-auto opacity-30"
        aria-hidden="true"
      />
      <AnimatePresence>
        {loading && (
          <motion.div
            className="pointer-events-none absolute inset-0 flex px-1 pt-0.5 *:stroke-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className="size-3 animate-spin" aria-hidden="true" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
