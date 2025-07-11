/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
Command: npx gltfjsx@6.5.3 public/models/knight.glb
*/

import React, { forwardRef, useEffect, useImperativeHandle } from 'react'
import { useGraph } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'

const Knight = forwardRef(({animation, color = "blue", ...props}, ref) => {
  const group = React.useRef()
  const { scene, animations } = useGLTF('./models/knight.glb')
  // Skinned meshes need to be cloned
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { nodes, materials } = useGraph(clone)
  const { actions, names } = useAnimations(animations, group)

  if (actions["Death"]) {
    actions["Death"].loop = THREE.LoopOnce;
    actions["Death"].clampWhenFinished = true;
  }
  if (actions["HitImpact"]) {
    actions["HitImpact"].loop = THREE.LoopOnce;
    actions["HitImpact"].clampWhenFinished = true;
  }

  // Fade in and out animation when switching between animations
  useEffect(() => {
      actions[animation]?.reset().fadeIn(0.24).play();
      return () => actions?.[animation]?.fadeOut(0.24);
    }, [animation]);

    // Optional: expose sword bone for tracking
  useImperativeHandle(ref, () => ({
  getSwordWorldPosition: () => {
    const swordBone = nodes.mixamorigSword_joint;
    if (!swordBone) return null;
    const pos = new THREE.Vector3();
    swordBone.getWorldPosition(pos);
    return pos;
  },
  getSwordWorldQuaternion: () => {
    const swordBone = nodes.mixamorigSword_joint;
    if (!swordBone) return null;
    const quat = new THREE.Quaternion();
    swordBone.getWorldQuaternion(quat);
    return quat;
  }
}));

  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Scene">
        <group name="Idle" rotation={[Math.PI / 2, 0, 0]} scale={0.016}>
          <primitive object={nodes.mixamorigHips} />
          <skinnedMesh name="Paladin_J_Sword" geometry={nodes.Paladin_J_Nordstrom.geometry} material={materials.Paladin_MAT} skeleton={nodes.Paladin_J_Nordstrom.skeleton} >
            <meshStandardMaterial color={color} />
          </skinnedMesh>
          <skinnedMesh name="Paladin_J_Nordstrom_Shield" geometry={nodes.Paladin_J_Nordstrom_Helmet.geometry} material={materials.Paladin_MAT} skeleton={nodes.Paladin_J_Nordstrom_Helmet.skeleton} >
          <meshStandardMaterial color={color} />
          </skinnedMesh>
          <skinnedMesh name="Paladin_J_Nordstrom_Helmet" geometry={nodes.Paladin_J_Nordstrom_Shield.geometry} material={materials.Paladin_MAT} skeleton={nodes.Paladin_J_Nordstrom_Shield.skeleton} />

          <skinnedMesh name="Paladin_J_Nordstrom_Body" geometry={nodes.Paladin_J_Nordstrom_Sword.geometry} material={materials.Paladin_MAT} skeleton={nodes.Paladin_J_Nordstrom_Sword.skeleton} />
        </group>
      </group>
    </group>
  )
})

export default Knight
useGLTF.preload('./models/knight.glb')
