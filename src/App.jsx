import { Canvas } from "@react-three/fiber";
import {
  GizmoHelper,
  GizmoViewport,
  KeyboardControls,
  Loader,
  OrbitControls,
} from "@react-three/drei";
import { Experience } from "./components/Experience";
import { Suspense, useMemo } from "react";
import { Leaderboard } from "./components/Leaderboard";
import { JoystickOverlay } from "./components/UIOverlay";
// import { Perf } from "r3f-perf";

// Define keyboard control mappings



function App() {

  return (
    <>
    <Loader/>

      <Leaderboard/>
      <JoystickOverlay enabled={true} />
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

    </>
  );
}

export default App;
