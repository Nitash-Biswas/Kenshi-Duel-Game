import { useEffect, useRef, useState } from "react";
import Character from "./Character";
import { CapsuleCollider, RigidBody } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import { Vector3 } from "three";
// import { useControls } from "leva";

const CharacterController = () => {
  const rb = useRef();
  const characterRef = useRef();
  const cameraTarget = useRef();
  const cameraPivot = useRef();

  const [animation, setAnimation] = useState("idle");
  const [, getKeys] = useKeyboardControls();

  const direction = new Vector3();
  const forward = new Vector3();
  const side = new Vector3();
  const velocity = new Vector3();

  const WALK_SPEED = 2;
  const RUN_SPEED = 6;

  // const { isOrbit } = useControls({ isOrbit: false });

  const lerpAngle = (a, b, t) => {
    const delta =
      ((((b - a) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
    return a + delta * t;
  };

  useFrame(({ camera }) => {
    const keys = getKeys();
    const isMoving = keys.forward || keys.backward || keys.left || keys.right;
    const speed = keys.run ? RUN_SPEED : WALK_SPEED;

    forward.set(0, 0, Number(keys.forward) - Number(keys.backward));
    side.set(Number(keys.left) - Number(keys.right), 0, 0);
    direction.copy(forward).add(side).normalize().multiplyScalar(speed);

    // Update velocity via rigidbody
    if (rb.current) {
      velocity.set(direction.x, rb.current.linvel().y, direction.z);
      rb.current.setLinvel(velocity, true);
    }

    // Smoothly rotate the character towards movement direction
    if (isMoving && characterRef.current) {
      const targetAngle = Math.atan2(direction.x, direction.z);
      const currentY = characterRef.current.rotation.y;
      characterRef.current.rotation.y = lerpAngle(currentY, targetAngle, 0.1);
    }

    // Switch animations
    setAnimation(isMoving ? (speed === RUN_SPEED ? "Run" : "Walk") : "Idle");

    // Lerp camera behind character
    if (cameraPivot.current && cameraTarget.current && characterRef.current) {
      camera.position.lerp(
        cameraPivot.current.getWorldPosition(new Vector3()),
        0.1
      );
      const lookAt = cameraTarget.current.getWorldPosition(new Vector3());
      camera.lookAt(lookAt);
    }
  });

  return (
    <RigidBody colliders={false} lockRotations ref={rb} position={[0, 0, 0]}>
      <group>
        {/* Camera follow points */}
        {/* {!isOrbit && (
          <>
            {" "}
            <group ref={cameraTarget} position={[0, 1.2, 0]} />
            <group ref={cameraPivot} position={[0, 3.0, -4]} />
          </>
        )} */}

        {/* Character */}
        <group ref={characterRef}>
          <Character scale={1} position-y={-0.25} animation={animation} color="red"/>
        </group>
      </group>
      <CapsuleCollider args={[0.54, 0.2]} position={[0, 0.5, 0]} />
    </RigidBody>
  );
};

export default CharacterController;
