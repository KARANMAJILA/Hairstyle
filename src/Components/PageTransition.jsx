import { motion } from "framer-motion";

export default function PageTransition({ children }) {
  const animation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.5, ease: "easeInOut" },
  };

  return (
    <motion.div
      {...animation}
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8"
    >
      {children}
    </motion.div>
  );
}
