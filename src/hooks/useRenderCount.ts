// https://github.com/sergeyleschev/react-custom-hooks/blob/main/src/hooks/useRenderCount/useRenderCount.js
import { useEffect, useRef } from "react";

export default function useRenderCount(start = 1) {
  const renderCount = useRef(start);

  useEffect(() => {
    renderCount.current++;
  });

  return renderCount.current;
}
