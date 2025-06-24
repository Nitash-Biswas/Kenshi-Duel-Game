import { useRef, useState } from "react";
import Character from "./Character";
import { CapsuleCollider, RigidBody, vec3 } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { isHost } from "playroomkit";
import { CameraControls } from "@react-three/drei";
const MOVEMENT_SPEED = 20;

export const Controller = ({ state, joystick, userPlayer, ...props }) => {
  const groupRef = useRef();
  const characterRef = useRef();
  const rBodyRef = useRef();
  const cameraRef = useRef();
  const [animation, setAnimation] = useState("Idle");

  useFrame((_, delta) => {
    //Camera follow
    if(cameraRef.current){
        const cameraDistanceY = window.innerWidth < 1024 ? 1.6 : 2.3; //16 for mobile, 20 for desktop
        const cameraDistanceZ = window.innerWidth < 1024 ? 1.2 : 2.6; //16 for mobile, 20 for desktop
        const playerWorldPos = vec3(rBodyRef.current.translation());
        cameraRef.current.setLookAt(
            //Camera position
            playerWorldPos.x,
            playerWorldPos.y + cameraDistanceY,
            playerWorldPos.z + cameraDistanceZ,
            //Camera target
            playerWorldPos.x +0.2,
            playerWorldPos.y + 1.5,
            playerWorldPos.z
        )
    }


    //Update player position based on joystick state
    const angle = joystick.angle();
    if (joystick.isJoystickPressed() && angle) {
      setAnimation("Run");
      characterRef.current.rotation.y = angle;

      // move character in its own direction
      const impulse = {
        x: Math.sin(angle) * MOVEMENT_SPEED * delta,
        y: 0,
        z: Math.cos(angle) * MOVEMENT_SPEED * delta,
      };

      rBodyRef.current.applyImpulse(impulse, true);
    } else {
      setAnimation("Idle");
    }

    //Sync player position
    if (isHost()) {
      state.setState("pos", rBodyRef.current.translation());
    } else {
      const pos = state.getState("pos");
      if (pos) {
        rBodyRef.current.setTranslation(pos);
      }
    }
  });

  return (
    <group ref={groupRef} {...props}>
        {
            userPlayer && (<CameraControls ref={cameraRef}/>)
        }
      <RigidBody
        ref={rBodyRef}
        colliders={false}
        lockRotations
        linearDamping={12}
        type={isHost() ? "dynamic" : "kinematicPosition"}
      >
        <group ref={characterRef}>
          <Character color={state.state.profile?.color} animation={animation}  />
        </group>
        <CapsuleCollider args={[0.65, 0.2]} position={[0, 0.84, 0.1]} />
      </RigidBody>
    </group>
  );
};
