import { useCallback, useRef, useState } from "react";

/** Largura visível da ação revelada ao deslizar. */
export const SWIPE_ACTION_WIDTH_PX = 88;

/** Deslocamento mínimo para efetivar ao soltar. */
export const SWIPE_COMMIT_THRESHOLD_PX = 56;

const TAP_TOLERANCE_PX = 8;
const DIRECTION_LOCK_PX = 10;

interface UseRecordSwipeActionOptions {
  enabled: boolean;
  onTap: () => void;
  onCommit: () => Promise<void>;
}

interface DragState {
  pointerId: number | null;
  startX: number;
  startY: number;
  startOffset: number;
  lockedHorizontal: boolean;
  moved: boolean;
}

export function useRecordSwipeAction({
  enabled,
  onTap,
  onCommit,
}: UseRecordSwipeActionOptions) {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const offsetRef = useRef(0);

  const setOffset = useCallback((value: number) => {
    offsetRef.current = value;
    setOffsetX(value);
  }, []);

  const dragRef = useRef<DragState>({
    pointerId: null,
    startX: 0,
    startY: 0,
    startOffset: 0,
    lockedHorizontal: false,
    moved: false,
  });

  const resetDrag = useCallback(() => {
    dragRef.current = {
      pointerId: null,
      startX: 0,
      startY: 0,
      startOffset: 0,
      lockedHorizontal: false,
      moved: false,
    };
    setIsDragging(false);
  }, []);

  const animateTo = useCallback(
    (target: number) => {
      setOffset(target);
    },
    [setOffset],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!enabled || isSettling) {
        return;
      }

      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startOffset: offsetRef.current,
        lockedHorizontal: false,
        moved: false,
      };

      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [enabled, isSettling, setOffset],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const drag = dragRef.current;
      if (!enabled || drag.pointerId !== event.pointerId || isSettling) {
        return;
      }

      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;

      if (!drag.lockedHorizontal) {
        if (
          Math.abs(deltaX) < DIRECTION_LOCK_PX &&
          Math.abs(deltaY) < DIRECTION_LOCK_PX
        ) {
          return;
        }

        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          resetDrag();
          event.currentTarget.releasePointerCapture(event.pointerId);
          return;
        }

        drag.lockedHorizontal = true;
        setIsDragging(true);
      }

      drag.moved = true;
      const nextOffset = Math.max(
        0,
        Math.min(SWIPE_ACTION_WIDTH_PX, drag.startOffset + deltaX),
      );
      setOffset(nextOffset);
    },
    [enabled, isSettling, resetDrag, setOffset],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const drag = dragRef.current;
      if (drag.pointerId !== event.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      const totalMoveX = Math.abs(event.clientX - drag.startX);
      const totalMoveY = Math.abs(event.clientY - drag.startY);

      if (!drag.lockedHorizontal && !drag.moved) {
        resetDrag();
        if (
          totalMoveX <= TAP_TOLERANCE_PX &&
          totalMoveY <= TAP_TOLERANCE_PX &&
          !isSettling
        ) {
          onTap();
        }
        return;
      }

      resetDrag();

      if (offsetRef.current >= SWIPE_COMMIT_THRESHOLD_PX) {
        setIsSettling(true);
        animateTo(SWIPE_ACTION_WIDTH_PX);

        void onCommit()
          .catch(() => {
            animateTo(0);
          })
          .finally(() => {
            setIsSettling(false);
            animateTo(0);
          });
        return;
      }

      animateTo(0);
    },
    [animateTo, isSettling, onCommit, onTap, resetDrag],
  );

  const handlePointerCancel = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const drag = dragRef.current;
      if (drag.pointerId !== event.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      resetDrag();
      if (!isSettling) {
        animateTo(0);
      }
    },
    [animateTo, isSettling, resetDrag],
  );

  return {
    offsetX,
    isDragging,
    isSettling,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
  };
}
