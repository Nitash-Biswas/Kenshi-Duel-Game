import { CapsuleCollider, RigidBody, vec3 } from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import Knight from "./Knight";
import { Billboard, CameraControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { isHost, myPlayer } from "playroomkit";

export const Controller = ({ state, joystick, userPlayer, onKilled, ...props }) => {
  const groupRef = useRef();
  const characterRef = useRef();
  const rBodyRef = useRef();
  const cameraRef = useRef();
  const knightRef = useRef();
  const swordBodyRef = useRef();
  const lastHitTimeRef = useRef({});
  const isSlashingRef = useRef(false);

  const [health, setHealth] = useState(state.state.health);
  const [animation, setAnimation] = useState("Idle");
  const [isCinematic, setIsCinematic] = useState(false);
  const cinematicStartTime = useRef(null);

  const cameraDistanceY = window.innerWidth < 1024 ? 5.0 : 5.2;
  const cameraDistanceZ = window.innerWidth < 1024 ? 4.6 : 4.3;

  useEffect(() => {
    if (state.state.dead) {
      const audio = new Audio("/audios/dead.mp3");
      audio.volume = 0.5;
      audio.play();
    }
  }, [state.state.dead]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newHealth = state.state.health;
      setHealth((prev) => (prev !== newHealth ? newHealth : prev));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (state.state.health < 100) {
      const audio = new Audio("/audios/hit.mp3");
      audio.volume = 0.4;
      audio.play();
    }
  }, [state.state.health]);

  useEffect(() => {
    if (state.state.impact && !state.state.dead) {
      setAnimation("HitImpact");
      setTimeout(() => {
        if (!state.state.dead) state.setState("impact", false);
      }, 500);
    }
  }, [state.state.impact]);

  useEffect(() => {
    const { cinematicFor } = state.state;
    const myId = myPlayer()?.id;
    console.log(cinematicFor, myId);
    if (
      cinematicFor &&
      (cinematicFor.killer === myId || cinematicFor.victim === myId) &&
      cinematicStartTime.current !== cinematicFor.startTime
    ) {
      cinematicStartTime.current = cinematicFor.startTime;
      setIsCinematic(true);
    } else if (!cinematicFor) {
      setIsCinematic(false);
    }
  }, [state.state.cinematicFor]);

  useFrame(() => {
    if (cameraRef.current && rBodyRef.current) {
      const pos = vec3(rBodyRef.current.translation());

      if (isCinematic) {
        const elapsed = (Date.now() - cinematicStartTime.current) / 1000;
        const radius = 5;
        const height = 2.5;
        const angle = elapsed * 0.5;
        const camX = pos.x + radius * Math.cos(angle);
        const camZ = pos.z + radius * Math.sin(angle);
        const camY = pos.y + height + Math.sin(elapsed * 1.5) * 0.5;
        cameraRef.current.setLookAt(camX, camY, camZ, pos.x, pos.y + 1, pos.z);
        return;
      }

      cameraRef.current.setLookAt(
        pos.x + 0.2,
        pos.y + cameraDistanceY,
        pos.z + cameraDistanceZ,
        pos.x + 0.2,
        pos.y + 1.5,
        pos.z - 3.2
      );
    }

    if (state.state.dead) {
      setAnimation("Death");
      return;
    }

    if (rBodyRef.current && characterRef.current) {
      const angle = joystick.angle();
      const vel = { x: 0, y: 0, z: 0 };

      if (!state.state.impact) {
        if (joystick.isPressed("attack")) setAnimation("Slash");
        else if (joystick.isJoystickPressed() && angle) setAnimation("Run");
        else setAnimation("Idle");
      }

      if (joystick.isJoystickPressed() && angle) {
        characterRef.current.rotation.y = angle;
        vel.x = Math.sin(angle) * 6;
        vel.z = Math.cos(angle) * 6;
      }

      rBodyRef.current.setLinvel(vel, true);

      if (isHost()) {
        state.setState("pos", rBodyRef.current.translation());
        state.setState("isSlashing", isSlashingRef.current);
      } else {
        const pos = state.getState("pos");
        if (pos) rBodyRef.current.setTranslation(pos);
      }

      isSlashingRef.current = joystick.isPressed("attack");
      if (swordBodyRef.current)
        swordBodyRef.current.userData.isSlashing = isSlashingRef.current;

      if (
        knightRef.current &&
        swordBodyRef.current &&
        typeof knightRef.current.getSwordWorldPosition === "function"
      ) {
        const swordPos = knightRef.current.getSwordWorldPosition();
        const swordQuat = knightRef.current.getSwordWorldQuaternion?.() || new THREE.Quaternion();

        if (swordPos && swordQuat) {
          swordBodyRef.current.setNextKinematicTranslation(swordPos);
          swordBodyRef.current.setNextKinematicRotation(swordQuat);
        }
      }
    }
  });

  return (
    <group ref={groupRef} {...props}>
      {userPlayer && <CameraControls ref={cameraRef} />}

      <RigidBody
        ref={swordBodyRef}
        type="kinematicPosition"
        colliders={false}
        sensor
        userData={{ type: "sword", damage: 50, player: state.id }}
      >
        <CapsuleCollider
          args={[0.85, 0.1]}
          rotation={[Math.PI / 2 + 0.05, 0, 0.25]}
          position={[-0.16, -0.04, 0.7]}
          sensor
        />
      </RigidBody>

      <RigidBody
        ref={rBodyRef}
        colliders={false}
        lockRotations
        linearDamping={12}
        type={isHost() ? "dynamic" : "kinematicPosition"}
        onIntersectionEnter={({ other }) => {
          const now = Date.now();
          const attackerId = other.rigidBody.userData.player;
          const isSword = other.rigidBody.userData.type === "sword";
          const attackerIsSlashing = other.rigidBody.userData.isSlashing;

          const lastHitTime = lastHitTimeRef.current[attackerId] || 0;
          const HIT_COOLDOWN = 1000;

          if (
            isHost() &&
            isSword &&
            !state.state.dead &&
            attackerId !== state.id &&
            attackerIsSlashing &&
            now - lastHitTime > HIT_COOLDOWN
          ) {
            lastHitTimeRef.current[attackerId] = now;
            const newHealth = state.state.health - other.rigidBody.userData.damage;

            if (newHealth <= 0) {
              state.setState("deaths", state.state.deaths + 1);
              state.setState("dead", true);
              state.setState("health", 0);
              rBodyRef.current.setEnabled(false);
              swordBodyRef.current.setEnabled(false);

              state.setState("cinematicFor", {
                killer: attackerId,
                victim: state.id,
                startTime: Date.now(),
              });

              setTimeout(() => {
                rBodyRef.current.setEnabled(true);
                swordBodyRef.current.setEnabled(true);
                state.setState("dead", false);
                state.setState("health", 100);
                if (isHost()) state.setState("cinematicFor", null);
              }, 5000);

              onKilled(state.id, attackerId);
            } else {
              state.setState("health", newHealth);
              state.setState("impact", true);
            }
          }
        }}
      >
        <PlayerInfo health={health} state={state.state} />
        <group ref={characterRef}>
          <Knight
            ref={knightRef}
            color={state.state.profile?.color}
            animation={animation}
            scale={0.66}
          />
        </group>
        <CapsuleCollider args={[0.95, 0.2]} position={[0, 1.1, 0.1]} />
      </RigidBody>
    </group>
  );
};

const PlayerInfo = ({ state }) => {
  const health = state.health;
  const name = state.profile.name;
  return (
    <Billboard position-y={2.7}>
      <Text position-y={0.3} fontSize={0.2}>
        {name}
        <meshBasicMaterial color="black" />
      </Text>
      <mesh position-z={-0.001} position-y={0.16}>
        <planeGeometry args={[1, 0.07]} />
        <meshBasicMaterial color="black" transparent opacity={0.5} />
      </mesh>
      <mesh scale-x={health / 100} position-x={-0.5 * (1 - health / 100)} position-y={0.16}>
        <planeGeometry args={[1, 0.07]} />
        <meshBasicMaterial color="red" />
      </mesh>
    </Billboard>
  );
};