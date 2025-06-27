import {
  CapsuleCollider,
  CuboidCollider,
  RigidBody,
  vec3,
} from "@react-three/rapier";
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import Knight from "./Knight";
import { Billboard, CameraControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { isHost } from "playroomkit";

export const Controller = ({ state, joystick, userPlayer, ...props }) => {
  const groupRef = useRef();
  const characterRef = useRef();
  const rBodyRef = useRef();
  const cameraRef = useRef();
  const knightRef = useRef();
  const swordBodyRef = useRef(); // <— New RigidBody to move the collider

  const [animation, setAnimation] = useState("Idle");
  const cameraDistanceY = window.innerWidth < 1024 ? 2.6 : 2.8; //16 for mobile, 20 for desktop
  const cameraDistanceZ = window.innerWidth < 1024 ? 2.2 : 3.6; //16 for mobile, 20 for desktop

  useFrame(() => {
    if (cameraRef.current && rBodyRef.current) {
      const pos = vec3(rBodyRef.current.translation());
      cameraRef.current.setLookAt(
        //camera pos
        pos.x,
        pos.y + cameraDistanceY,
        pos.z + cameraDistanceZ,
        //target to look at
        pos.x + 1.0,
        pos.y + 1.5,
        pos.z
      );
    }

    if (rBodyRef.current && characterRef.current) {
      const angle = joystick.angle();
      const vel = { x: 0, y: 0, z: 0 };

      if (joystick.isJoystickPressed() && angle) {
        setAnimation("Run");
        characterRef.current.rotation.y = angle;
        vel.x = Math.sin(angle) * 6;
        vel.z = Math.cos(angle) * 6;
      } else {
        setAnimation("Idle");
      }

      rBodyRef.current.setLinvel(vel, true);

      // Multiplayer sync
      if (isHost()) {
        state.setState("pos", rBodyRef.current.translation());
      } else {
        const pos = state.getState("pos");
        if (pos) rBodyRef.current.setTranslation(pos);
      }

      if (joystick.isPressed("attack")) {
        setAnimation("Slash");
      }

      // Move the separate sword collider body
      if (
        knightRef.current &&
        swordBodyRef.current &&
        typeof knightRef.current.getSwordWorldPosition === "function"
      ) {
        const swordPos = knightRef.current.getSwordWorldPosition();
        const swordQuat = knightRef.current.getSwordWorldQuaternion?.();

        if (swordPos && swordQuat) {
          swordBodyRef.current.setNextKinematicTranslation(swordPos);
          swordBodyRef.current.setNextKinematicRotation(swordQuat);
        }
      }
    }
  });

  return (
    <>
      <group ref={groupRef} {...props}>
        {userPlayer && <CameraControls ref={cameraRef} />}

        {/* Sword Collider as a separate RigidBody */}
        <RigidBody
          ref={swordBodyRef}
          type="kinematicPosition"
          colliders={false}
        >
          <CapsuleCollider args={[0.65, 0.1]} rotation={[Math.PI/2 + 0.05, 0, 0.25]} position={[-0.16, -0.04, 0.7]} sensor />
        </RigidBody>

        <RigidBody
          ref={rBodyRef}
          colliders={false}
          lockRotations
          linearDamping={12}
          type={isHost() ? "dynamic" : "kinematicPosition"}
        >
          <PlayerInfo state={state.state} />
          <group ref={characterRef}>
            <Knight
              ref={knightRef}
              color={state.state.profile?.color}
              animation={animation}
            />
          </group>

          <CapsuleCollider args={[0.95, 0.2]} position={[0, 1.1, 0.1]} />
        </RigidBody>
      </group>
    </>
  );
};

const PlayerInfo = ({ state }) => {
  const health = state.health;
  const name = state.profile.name;
  return (
    <Billboard position-y={2.7} >
      <Text position-y={0.26} fontSize={0.2}>
        {name}
        <meshBasicMaterial color={"black"} />
      </Text>
      <mesh position-z={-0.001}>
        <planeGeometry args={[1, 0.2]} />
        <meshBasicMaterial color="black" transparent opacity={0.5} />
      </mesh>
      <mesh scale-x={health / 100} position-x={-0.5 * (1 - health / 100)}>
        <planeGeometry args={[1, 0.2]} />
        <meshBasicMaterial color="red" />
      </mesh>
    </Billboard>
  );
};
