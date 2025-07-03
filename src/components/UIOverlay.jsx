// UIOverlay.jsx
import { useKeyboardToTouchJoystick } from "../useKeyboardToJoystick";

export const JoystickOverlay = ({ enabled }) => {
  const keys = useKeyboardToTouchJoystick(enabled);

  return (
    <div style={{ position: "absolute", left: 40, bottom: 40, pointerEvents: "none", zIndex: 1000 }}>
      {keys.left && <Dot style={{ left: -20, top: -55 }} />}
      {keys.right && <Dot style={{ left: 130, top: -55 }} />}
      {keys.up && <Dot style={{ left: 55, top: -130 }} />}
      {keys.down && <Dot style={{ left: 55, top: 20 }} />}

      {keys.topLeft && <Dot style={{ left: 0, top: -105, background: "blue" }} />}
      {keys.topRight && <Dot style={{ left: 110, top: -105, background: "blue" }} />}
      {keys.bottomLeft && <Dot style={{ left: 0, top: -5, background: "blue" }} />}
      {keys.bottomRight && <Dot style={{ left: 110, top: -5, background: "blue" }} />}

      {keys.mouse && (
        <div style={{
          position: "absolute",
          pointerEvents: "none",
          left: "calc(100vw - 100px)",
          top: -25,
          zIndex: 1000
        }}>
          <Dot style={{ background: "red" }} />
        </div>
      )}
    </div>
  );
};

const Dot = ({ style }) => (
  <div
    style={{
      position: "absolute",
      width: 10,
      height: 10,
      background: "red",
      borderRadius: "50%",
      transform: "translate(-50%, -50%)",
      ...style,
    }}
  />
);
