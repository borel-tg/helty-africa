import { useCallback, useEffect, useRef } from "react";

const DEFAULT_MIN = 0.6;
const DEFAULT_MAX = 2.5;
const DEFAULT_STEP = 0.15;

function touchDistance(touches) {
  const [a, b] = touches;
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

/**
 * Pinch, double-tap, and ctrl/meta + wheel zoom for the PDF scroll container.
 */
export function usePdfZoomGestures({
  scale,
  setScale,
  minScale = DEFAULT_MIN,
  maxScale = DEFAULT_MAX,
  step = DEFAULT_STEP,
}) {
  const scrollRef = useRef(null);
  const scaleRef = useRef(scale);
  const pinchRef = useRef({ startDist: null, startScale: 1 });
  const lastTapRef = useRef(0);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  const clampScale = useCallback(
    (value) => Math.min(maxScale, Math.max(minScale, value)),
    [minScale, maxScale]
  );

  const zoomIn = useCallback(
    () => setScale((s) => clampScale(s + step)),
    [setScale, clampScale, step]
  );

  const zoomOut = useCallback(
    () => setScale((s) => clampScale(s - step)),
    [setScale, clampScale, step]
  );

  const resetZoom = useCallback(() => setScale(1), [setScale]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    const onTouchStart = (event) => {
      if (event.touches.length === 2) {
        pinchRef.current = {
          startDist: touchDistance(event.touches),
          startScale: scaleRef.current,
        };
        lastTapRef.current = 0;
        return;
      }

      if (event.touches.length === 1) {
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
          setScale((current) => (current > 1.05 ? 1 : clampScale(1.5)));
          lastTapRef.current = 0;
        } else {
          lastTapRef.current = now;
        }
      }
    };

    const onTouchMove = (event) => {
      if (event.touches.length !== 2 || pinchRef.current.startDist == null) return;
      event.preventDefault();
      const dist = touchDistance(event.touches);
      const ratio = dist / pinchRef.current.startDist;
      setScale(clampScale(pinchRef.current.startScale * ratio));
    };

    const onTouchEnd = (event) => {
      if (event.touches.length < 2) {
        pinchRef.current = { startDist: null, startScale: scaleRef.current };
      }
    };

    const onWheel = (event) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      setScale((current) =>
        clampScale(current + (event.deltaY < 0 ? step : -step))
      );
    };

    node.addEventListener("touchstart", onTouchStart, { passive: true });
    node.addEventListener("touchmove", onTouchMove, { passive: false });
    node.addEventListener("touchend", onTouchEnd);
    node.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      node.removeEventListener("touchstart", onTouchStart);
      node.removeEventListener("touchmove", onTouchMove);
      node.removeEventListener("touchend", onTouchEnd);
      node.removeEventListener("wheel", onWheel);
    };
  }, [setScale, clampScale, step]);

  return { scrollRef, zoomIn, zoomOut, resetZoom, clampScale };
}
