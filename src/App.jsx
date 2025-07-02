import { Canvas } from "@react-three/fiber";
import {
  GizmoHelper,
  GizmoViewport,
  KeyboardControls,
  Loader,
  OrbitControls,
} from "@react-three/drei";
import { Experience } from "./components/Experience";
import { Suspense } from "react";
import { Leaderboard } from "./components/Leaderboard";
// import { Perf } from "r3f-perf";

// Define keyboard control mappings
const keyboardMap = [
  { name: "forward", keys: ["KeyW", "ArrowUp"] },
  { name: "backward", keys: ["KeyS", "ArrowDown"] },
  { name: "left", keys: ["KeyA", "ArrowLeft"] },
  { name: "right", keys: ["KeyD", "ArrowRight"] },
  { name: "slash", keys: ["LButton"] },
];

function App() {
  return (
    <>
    <Loader/>
    <KeyboardControls map={keyboardMap}>
      <Leaderboard/>
      <Canvas shadows resize={{ scroll: false }}>
        {/* Debug Gizmo and Axes */}
        {/* <GizmoHelper alignment="bottom-right" margin={[100, 100]}>
          <GizmoViewport />
        </GizmoHelper> */}
        {/* <axesHelper args={[5]} /> */}
        {/* <Perf position="top-left" /> */}
        {/* <OrbitControls/> */}
        {/* <mesh position={[2,2,2]}>
          <planeGeometry />
          <meshNormalMaterial side={2} />
        </mesh> */}
        <Suspense>
          <Experience />
        </Suspense>
      </Canvas>
    </KeyboardControls>
    </>
  );
}

export default App;
