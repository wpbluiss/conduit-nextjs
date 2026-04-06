"use client";

import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const DEPARTMENTS = [
  { name: "Engineering", color: "#ff6b35", agents: 47 },
  { name: "Sales", color: "#3b82f6", agents: 31 },
  { name: "Marketing", color: "#f59e0b", agents: 24 },
  { name: "Support", color: "#00c9ff", agents: 38 },
  { name: "Finance", color: "#a855f7", agents: 19 },
  { name: "HR", color: "#f59e0b", agents: 15 },
  { name: "Legal", color: "#ef4444", agents: 12 },
  { name: "Operations", color: "#6366f1", agents: 28 },
  { name: "Product", color: "#3b82f6", agents: 22 },
];

function Floor({ index, dept }: { index: number; dept: (typeof DEPARTMENTS)[0] }) {
  const ref = useRef<THREE.Group>(null);
  const y = index * 0.55 - 2.2;

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = y + Math.sin(t * 0.5 + index * 0.4) * 0.03;
  });

  const color = new THREE.Color(dept.color);

  return (
    <group ref={ref} position={[0, y, 0]}>
      <mesh>
        <boxGeometry args={[3, 0.08, 2]} />
        <meshStandardMaterial color="#0e0e18" transparent opacity={0.9} metalness={0.5} roughness={0.3} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(3, 0.08, 2)]} />
        <lineBasicMaterial color={color} transparent opacity={0.5} />
      </lineSegments>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[2.9, 0.36, 1.9]} />
        <meshStandardMaterial color={dept.color} transparent opacity={0.06} metalness={0.8} roughness={0.1} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[2.6, 0.02, 0.02]} />
        <meshBasicMaterial color={dept.color} transparent opacity={0.8} />
      </mesh>
      {Array.from({ length: Math.min(dept.agents / 5, 6) }).map((_, i) => (
        <mesh key={i} position={[-1 + i * 0.5, 0.12, -0.5 + (i % 2) * 1]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color={dept.color} />
        </mesh>
      ))}
      <pointLight color={dept.color} intensity={0.15} distance={2} position={[0, 0.3, 0]} />
    </group>
  );
}

function ScrollCamera({ scrollProgress }: { scrollProgress: number }) {
  const { camera } = useThree();

  useFrame(() => {
    const p = Math.min(1, Math.max(0, scrollProgress));

    // Phase 1 (0-0.5): wide view slowly pushing in
    // Phase 2 (0.5-1.0): zoom into the Engineering floor (top floor)
    if (p <= 0.5) {
      const t = p / 0.5;
      camera.position.x = THREE.MathUtils.lerp(0, 1.5, t);
      camera.position.y = THREE.MathUtils.lerp(1, 2.5, t);
      camera.position.z = THREE.MathUtils.lerp(7, 4, t);
    } else {
      const t = (p - 0.5) / 0.5;
      camera.position.x = THREE.MathUtils.lerp(1.5, 2, t);
      camera.position.y = THREE.MathUtils.lerp(2.5, 2.8, t);
      camera.position.z = THREE.MathUtils.lerp(4, 1.8, t);
    }

    camera.lookAt(0, p * 1.5, 0);
  });

  return null;
}

function Building() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = Math.PI / 6 + Math.sin(t * 0.1) * 0.05;
  });

  return (
    <group ref={groupRef} rotation={[Math.PI / 12, Math.PI / 6, 0]}>
      <mesh position={[0, 2.8, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.6, 8]} />
        <meshBasicMaterial color="#ff6b35" />
      </mesh>
      <mesh position={[0, 3.1, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#ff6b35" />
      </mesh>
      <pointLight color="#ff6b35" intensity={0.5} distance={3} position={[0, 3.1, 0]} />

      {DEPARTMENTS.map((dept, i) => (
        <Floor key={dept.name} index={i} dept={dept} />
      ))}

      <mesh position={[0, -2.7, 0]}>
        <boxGeometry args={[3.5, 0.05, 2.5]} />
        <meshStandardMaterial color="#0a0a12" metalness={0.7} roughness={0.2} />
      </mesh>
      <lineSegments position={[0, -2.7, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(3.5, 0.05, 2.5)]} />
        <lineBasicMaterial color="#ff6b35" transparent opacity={0.15} />
      </lineSegments>
    </group>
  );
}

export default function IsometricBuilding({ scrollProgress = 0 }: { scrollProgress: number }) {
  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 1, 7], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 8, 5]} intensity={0.3} color="#ffffff" />
        <directionalLight position={[-3, 4, -2]} intensity={0.15} color="#ff6b35" />
        <ScrollCamera scrollProgress={scrollProgress} />
        <Building />
      </Canvas>
    </div>
  );
}
