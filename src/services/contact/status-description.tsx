import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/css/lib";

export const StatusDescription: React.FC<{
  message: React.ReactNode;
  status?: React.ReactNode;
  isSuccess?: boolean;
}> = ({ message, status, isSuccess }) => (
  <motion.span
    layout
    transition={{ layout: { duration: 0.3, ease: "easeOut" } }}
    className="my-1 block text-xs leading-snug"
  >
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={message?.toString()}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="block"
      >
        {message}
        {typeof isSuccess === "boolean" ? (isSuccess ? " ✅" : " ❌") : "..."}
      </motion.span>
    </AnimatePresence>
    <AnimatePresence mode="popLayout" initial={false}>
      {status && (
        <motion.span
          key={status.toString()}
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
          {status}
        </motion.span>
      )}
    </AnimatePresence>
  </motion.span>
);
