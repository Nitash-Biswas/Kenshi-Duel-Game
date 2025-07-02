import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import grassVertexShader from "../shaders/vertex.glsl";
import grassFragmentShader from "../shaders/fragment.glsl";
import { useControls } from "leva";

export const InstancedGrass = ({ count = 200000, fieldSize = 60, grassScale = 0.8, LODDistance = 20 }) => {
  const highDetailRef = useRef();
  const lowDetailRef = useRef();
  const { camera, clock } = useThree();
  const halfWidth = 0.06;
  const height = 1;

  const { tipColor, baseColor, fogColor } = useControls({
    tipColor: "#c8be9c",
    baseColor: "#404709",
    fogColor: "#e6ebef",
  });

  const createGrassGeometry = (segments) => {
    const taper = 0.005;
    const positions = [];
    for (let i = 0; i < segments - 1; i++) {
      const y0 = (i / segments) * height;
      const y1 = ((i + 1) / segments) * height;

      positions.push(
        -halfWidth + taper * i, y0, 0,
        halfWidth - taper * i, y0, 0,
        -halfWidth + taper * (i + 1), y1, 0,
        -halfWidth + taper * (i + 1), y1, 0,
        halfWidth - taper * i, y0, 0,
        halfWidth - taper * (i + 1), y1, 0
      );
    }

    positions.push(
      -halfWidth + taper * (segments - 1), ((segments - 1) / segments) * height, 0,
      halfWidth - taper * (segments - 1), ((segments - 1) / segments) * height, 0,
      0, height, 0
    );

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
    geo.computeVertexNormals();
    return geo;
  };

  const highDetailGeo = useMemo(() => createGrassGeometry(7), []);
  const lowDetailGeo = useMemo(() => createGrassGeometry(2), []);

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: grassVertexShader,
    fragmentShader: grassFragmentShader,
    uniforms: {
      uFrequency: { value: new THREE.Vector2(5, 5) },
      uTime: { value: 0 },
      uSpeed: { value: 3 },
      uTipColor: { value: new THREE.Color(tipColor) },
      uBaseColor: { value: new THREE.Color(baseColor) },
      uFogColor: { value: new THREE.Color(fogColor) },
      uHalfWidth: { value: halfWidth },
      uBladeHeight: { value: height },
    },
    side: THREE.DoubleSide,
  }), []);

  // Animate sway
  useFrame(() => {
    material.uniforms.uTime.value = clock.getElapsedTime();
  });

  // Update Leva colors
  useEffect(() => {
    material.uniforms.uTipColor.value.set(tipColor);
    material.uniforms.uBaseColor.value.set(baseColor);
    material.uniforms.uFogColor.value.set(fogColor);
  }, [tipColor, baseColor, fogColor, material]);

  const grassData = useMemo(() => {
    const blades = [];
    for (let i = 0; i < count; i++) {
      blades.push({
        x: (Math.random() - 0.5) * fieldSize,
        z: (Math.random() - 0.5) * fieldSize,
        rotation: Math.random() * Math.PI * 2,
      });
    }
    return blades;
  }, [count, fieldSize]);

  // ✅ Only run LOD updates when camera moves
  useEffect(() => {
    let previousPosition = new THREE.Vector3().copy(camera.position);
    const dummy = new THREE.Object3D();

    const updateLOD = () => {
      const currentPosition = camera.position.clone();
      const moved = currentPosition.distanceToSquared(previousPosition) > 0.0001;

      if (moved) {
        previousPosition.copy(currentPosition);

        let highIndex = 0;
        let lowIndex = 0;

        for (let i = 0; i < grassData.length; i++) {
          const { x, z, rotation } = grassData[i];
          const distance = new THREE.Vector3(x, 0, z).distanceTo(currentPosition);

          dummy.position.set(x, 0, z);
          dummy.scale.set(grassScale, grassScale, grassScale);
          dummy.rotation.y = rotation;
          dummy.updateMatrix();

          if (distance < LODDistance) {
            if (highIndex < count) highDetailRef.current.setMatrixAt(highIndex++, dummy.matrix);
          } else {
            if (lowIndex < count) lowDetailRef.current.setMatrixAt(lowIndex++, dummy.matrix);
          }
        }

        highDetailRef.current.count = highIndex;
        lowDetailRef.current.count = lowIndex;
        highDetailRef.current.instanceMatrix.needsUpdate = true;
        lowDetailRef.current.instanceMatrix.needsUpdate = true;
      }

      requestAnimationFrame(updateLOD);
    };

    updateLOD();

    return () => {
      // nothing to clean up here, since RAF is recursive
    };
  }, [camera, grassData, grassScale, LODDistance]);


  // const testMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "red" }), []);

  return (
    <>
      <instancedMesh ref={highDetailRef} args={[highDetailGeo, material, count]} />
      <instancedMesh ref={lowDetailRef} args={[lowDetailGeo, material, count]} />
    </>
  );
};
