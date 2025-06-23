"use client";
import {
  Environment,
  OrthographicCamera,
  Sky,

} from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { Physics } from "@react-three/rapier";
import CharacterController from "./CharacterController";
import Plane from "./Plane";
import {  InstancedGrass } from "./Grass";
import { Fog } from "three";
import { insertCoin, Joystick, onPlayerJoin } from "playroomkit";


export const Experience = () => {
  const [players, setPlayers] = useState([]);
  const start = async () => {
    // Start the game
    await insertCoin();

    // Create a joystick controller for each joining player
    onPlayerJoin((state) => {
      // Joystick will only create UI for current player (myPlayer)
      // For others, it will only sync their state
      const joystick = new Joystick(state, {
        type: "angular",
        buttons: [{ id: "fire", label: "Fire" }],
      });
      const newPlayer = { state, joystick };
      state.setState("health", 100);
      state.setState("deaths", 0);
      state.setState("kills", 0);
      setPlayers((players) => [...players, newPlayer]);
      state.onQuit(() => {
        setPlayers((players) => players.filter((p) => p.state.id !== state.id));
      });
    });
  };

  useEffect(() => {
    start();
  }, []);

  const shadowCameraRef = useRef();
  return (
    <>
      <Environment preset="sunset" />
      <Sky
        distance={450000}
        sunPosition={[100, 50, 100]}
        inclination={0.49}
        azimuth={0.25}
      />

      <directionalLight
        intensity={0.65}
        castShadow
        position={[-15, 10, 15]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.00005}
      >
        <OrthographicCamera
          left={-22}
          right={15}
          top={10}
          bottom={-20}
          ref={shadowCameraRef}
          attach={"shadow-camera"}
        />
      </directionalLight>

      <Physics debug >

        {/* Ground Plane */}
        <Plane/>

        <CharacterController />



      </Physics>
      {/* <fogExp2 attach="fog" color="#cad4db" density={0.1} />
      <mesh>
        <boxGeometry args={[100, 100, 100]} />
        <meshStandardMaterial color="#78623b" side={2}/>
      </mesh>
      <InstancedGrass/> */}

    </>
  );
};
