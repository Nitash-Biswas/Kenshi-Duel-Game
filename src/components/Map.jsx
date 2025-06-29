import { useGLTF } from "@react-three/drei";
import { CuboidCollider, RigidBody } from "@react-three/rapier";

export const Map = ({scale}) => {
  const map = useGLTF("./models/map.glb");

  return (
    <>
     <primitive object={map.scene} scale={scale} />

    <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[1, 6, 30]} position={[28, 5, 0]} />
        <CuboidCollider args={[1, 6, 30]} position={[-28, 5, 0]} />
        <CuboidCollider args={[30, 6, 1]} position={[0, 5, 30]} />
        <CuboidCollider args={[30, 6, 1]} position={[0, 5, -29]} />
    </RigidBody>
    </>


  );
};

useGLTF.preload("./models/map.glb");
