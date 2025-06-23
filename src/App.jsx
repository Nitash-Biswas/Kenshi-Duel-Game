import { Canvas } from "@react-three/fiber";
import {
  GizmoHelper,
  GizmoViewport,
  KeyboardControls,
  OrbitControls,
} from "@react-three/drei";
import { Experience } from "./components/Experience";
//import { Perf } from "r3f-perf";

// Define keyboard control mappings
const keyboardMap = [
  { name: "forward", keys: ["KeyW", "ArrowUp"] },
  { name: "backward", keys: ["KeyS", "ArrowDown"] },
  { name: "left", keys: ["KeyA", "ArrowLeft"] },
  { name: "right", keys: ["KeyD", "ArrowRight"] },
  { name: "run", keys: ["Shift"] },
];

function App() {
  return (
    <KeyboardControls map={keyboardMap}>
      <Canvas shadows camera={{ position: [5, 1.5, 0], fov: 60 }}>
        {/* Debug Gizmo and Axes */}
        <GizmoHelper alignment="bottom-right" margin={[100, 100]}>
          <GizmoViewport />
        </GizmoHelper>
        {/* <axesHelper args={[5]} /> */}
        {/* <Perf position="top-left" /> */}
        <OrbitControls/>
        {/* <mesh position={[2,2,2]}>
          <planeGeometry />
          <meshNormalMaterial side={2} />
        </mesh> */}

        <Experience />
      </Canvas>
    </KeyboardControls>
  );
}

export default App;
