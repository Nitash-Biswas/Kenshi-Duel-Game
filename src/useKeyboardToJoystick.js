import { useEffect, useRef, useState } from "react";

const keyMap = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};

const directionToCoords = {
  up: { x: 100, y: window.innerHeight - 150 },
  down: { x: 100, y: window.innerHeight - 50 },
  left: { x: 50, y: window.innerHeight - 100 },
  right: { x: 150, y: window.innerHeight - 100 },
};

export const useKeyboardToTouchJoystick = (enabled = true) => {
  const [visualKeys, setVisualKeys] = useState({});
  const [mouseDown, setMouseDown] = useState(false);

  const activeKeys = useRef(new Set());
  const pointerId = useRef(Math.floor(Math.random() * 10000));
  const pointerDownSent = useRef(false);
  const lastCoords = useRef(null);
  const mousePointerId = useRef(pointerId.current + 1);
  const MOUSE_X = window.innerWidth - 60;
  const MOUSE_Y = window.innerHeight - 60;

  const dispatchPointerEvent = (type, x, y, pid = pointerId.current) => {
    const target = document.elementFromPoint(x, y);
    if (!target) return;

    const event = new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      pointerType: "touch",
      pointerId: pid,
    });

    target.dispatchEvent(event);
    if (pid === pointerId.current) lastCoords.current = { x, y };
  };

  const getAverageCoords = () => {
    const coords = Array.from(activeKeys.current)
      .map((dir) => directionToCoords[dir])
      .filter(Boolean);

    if (coords.length === 0) return null;

    const sum = coords.reduce(
      (acc, cur) => ({
        x: acc.x + cur.x,
        y: acc.y + cur.y,
      }),
      { x: 0, y: 0 }
    );

    return {
      x: sum.x / coords.length,
      y: sum.y / coords.length,
    };
  };

  useEffect(() => {
    if (!enabled) return;

    // KEYBOARD INPUT
    const onKeyDown = (e) => {
      const dir = keyMap[e.key];
      if (!dir) return;

      if (!activeKeys.current.has(dir)) {
        activeKeys.current.add(dir);
        setVisualKeys((prev) => ({ ...prev, [dir]: true }));

        const coords = getAverageCoords();
        if (coords) {
          if (!pointerDownSent.current) {
            dispatchPointerEvent("pointerdown", coords.x, coords.y);
            pointerDownSent.current = true;
          } else {
            dispatchPointerEvent("pointermove", coords.x, coords.y);
          }
        }
      }
    };

    const onKeyUp = (e) => {
      const dir = keyMap[e.key];
      if (!dir) return;

      if (activeKeys.current.has(dir)) {
        activeKeys.current.delete(dir);
        setVisualKeys((prev) => ({ ...prev, [dir]: false }));

        const coords = getAverageCoords();
        if (coords && activeKeys.current.size > 0) {
          dispatchPointerEvent("pointermove", coords.x, coords.y);
        }

        if (activeKeys.current.size === 0 && pointerDownSent.current && lastCoords.current) {
          dispatchPointerEvent("pointerup", lastCoords.current.x, lastCoords.current.y);
          pointerDownSent.current = false;
          lastCoords.current = null;
        }
      }
    };

    // MOUSE INPUT
    const onMouseDown = (e) => {
      if (e.button === 0) {
        setMouseDown(true);
        dispatchPointerEvent("pointerdown", MOUSE_X, MOUSE_Y, mousePointerId.current);
      }
    };

    const onMouseUp = (e) => {
      if (e.button === 0) {
        setMouseDown(false);
        dispatchPointerEvent("pointerup", MOUSE_X, MOUSE_Y, mousePointerId.current);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [enabled]);

  const diagonalVisualKeys = {
    ...visualKeys,
    topLeft: visualKeys.up && visualKeys.left,
    topRight: visualKeys.up && visualKeys.right,
    bottomLeft: visualKeys.down && visualKeys.left,
    bottomRight: visualKeys.down && visualKeys.right,
    mouse: mouseDown,
  };

  return diagonalVisualKeys;
};
