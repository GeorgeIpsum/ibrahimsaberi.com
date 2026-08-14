import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/css/lib";

export const Subtask: React.FC<{
  subtask: React.ReactNode;
  subtaskResult?: React.ReactNode;
  isSuccess?: boolean;
}> = ({ subtask, subtaskResult, isSuccess }) => (
  <motion.span
    layout
    transition={{ layout: { duration: 0.3, ease: "easeOut" } }}
    className="my-1 block text-xs leading-snug"
  >
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={subtask?.toString()}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="block"
      >
        {subtask}
        {typeof isSuccess === "boolean" ? (isSuccess ? " ✅" : " ❌") : "..."}
      </motion.span>
    </AnimatePresence>
    <AnimatePresence mode="popLayout" initial={false}>
      {subtaskResult && (
        <motion.span
          key={subtaskResult.toString()}
          initial={{ opacity: 0, x: 30, scaleX: 0.9 }}
          animate={{
            opacity: 1,
            x: 0,
            scaleX: 1,
            transition: { duration: 0.3, delay: 0.2 },
          }}
          exit={{
            opacity: 0,
            x: -30,
            scaleX: 0.9,
            transition: { duration: 0.25 },
          }}
          className={cn(
            "block",
            isSuccess ? "text-success-foreground" : "text-warning-foreground",
          )}
        >
          {subtaskResult}
        </motion.span>
      )}
    </AnimatePresence>
  </motion.span>
);
