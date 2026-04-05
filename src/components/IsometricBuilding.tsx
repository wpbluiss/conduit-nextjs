"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const DEPARTMENTS = [
  { name: "Engineering", color: "#00e5a0", agents: 47 },
  { name: "Sales", color: "#3b82f6", agents: 31 },
  { name: "Marketing", color: "#ff6b35", agents: 24 },
  { name: "Support", color: "#00c9ff", agents: 38 },
  { name: "Finance", color: "#a855f7", agents: 19 },
  { name: "HR", color: "#f59e0b", agents: 15 },
  { name: "Legal", color: "#ef4444", agents: 12 },
  { name: "Operations", color: "#10b981", agents: 28 },
  { name: "Product", color: "#6366f1", agents: 22 },
];

function Floor({
  index,
  dept,
}: {
  index: number;
  dept: (typeof DEPARTMENTS)[0];
}) {
  const ref = useRef<THREE.Group>(null);
  const edgeRef = useRef<THREE.LineSegments>(null);
  const y = index * 0.55 - 2.2;

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = y + Math.sin(t * 0.5 + index * 0.4) * 0.03;
  });

  const color = new THREE.Color(dept.color);

  return (
    <group ref={ref} position={[0, y, 0]}>
      {/* Floor slab */}
      <mesh>
        <boxGeometry args={[3, 0.08, 2]} />
        <meshStandardMaterial
          color="#0e0e18"
          transparent
          opacity={0.9}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>

      {/* Glowing edge wireframe */}
      <lineSegments ref={edgeRef}>
        <edgesGeometry args={[new THREE.BoxGeometry(3, 0.08, 2)]} />
        <lineBasicMaterial color={color} transparent opacity={0.5} />
      </lineSegments>

      {/* Glass walls */}
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[2.9, 0.36, 1.9]} />
        <meshStandardMaterial
          color={dept.color}
          transparent
          opacity={0.06}
          metalness={0.8}
          roughness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Interior light strip */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[2.6, 0.02, 0.02]} />
        <meshBasicMaterial color={dept.color} transparent opacity={0.8} />
      </mesh>

      {/* Activity dots */}
      {Array.from({ length: Math.min(dept.agents / 5, 6) }).map((_, i) => (
        <mesh
          key={i}
          position={[
            -1 + i * 0.5,
            0.12,
            -0.5 + (i % 2) * 1,
          ]}
        >
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color={dept.color} />
        </mesh>
      ))}

      {/* Point light per floor */}
      <pointLight
        color={dept.color}
        intensity={0.15}
        distance={2}
        position={[0, 0.3, 0]}
      />
    </group>
  );
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
      {/* Roof antenna */}
      <mesh position={[0, 2.8, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.6, 8]} />
        <meshBasicMaterial color="#00e5a0" />
      </mesh>
      <mesh position={[0, 3.1, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#00e5a0" />
      </mesh>
      <pointLight
        color="#00e5a0"
        intensity={0.5}
        distance={3}
        position={[0, 3.1, 0]}
      />

      {/* Floors */}
      {DEPARTMENTS.map((dept, i) => (
        <Floor key={dept.name} index={i} dept={dept} />
      ))}

      {/* Base platform */}
      <mesh position={[0, -2.7, 0]}>
        <boxGeometry args={[3.5, 0.05, 2.5]} />
        <meshStandardMaterial
          color="#0a0a12"
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>
      <lineSegments position={[0, -2.7, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(3.5, 0.05, 2.5)]} />
        <lineBasicMaterial color="#00e5a0" transparent opacity={0.2} />
      </lineSegments>

      {/* Ground glow */}
      <mesh position={[0, -2.75, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5, 4]} />
        <meshBasicMaterial
          color="#00e5a0"
          transparent
          opacity={0.02}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export default function IsometricBuilding() {
  return (
    <div className="w-full h-[500px] md:h-[600px] relative">
      <Canvas
        camera={{ position: [0, 1, 7], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.2} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={0.3}
          color="#ffffff"
        />
        <directionalLight
          position={[-3, 4, -2]}
          intensity={0.15}
          color="#00e5a0"
        />
        <Building />
      </Canvas>

      {/* Floor legend */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-1.5">
        {DEPARTMENTS.map((dept) => (
          <div
            key={dept.name}
            className="flex items-center gap-2 text-xs font-[family-name:var(--font-mono)] text-text3"
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: dept.color,
                boxShadow: `0 0 6px ${dept.color}40`,
              }}
            />
            <span className="text-text2">{dept.name}</span>
            <span className="text-text3 ml-auto tabular-nums">{dept.agents}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
