// src/middleware/useLogger.js
import { useLoggerContext } from './LoggerContext';

export default function useLogger() {
  const log = useLoggerContext();

  return (stack, level, pkg, message) => {
    log(stack, level, pkg, message);
  };
}
