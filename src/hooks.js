import { useCallback, useRef } from "react";

/** Devuelve una función que avisa "ejercicio resuelto" una sola vez por ejercicio. */
export function useSolveOnce(onSolved) {
  const done = useRef(false);
  return useCallback(() => {
    if (done.current) return;
    done.current = true;
    onSolved?.();
  }, [onSolved]);
}
