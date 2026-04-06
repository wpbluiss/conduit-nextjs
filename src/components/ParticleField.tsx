"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Particles({ count = 300, scrollY }: { count?: number; scrollY: number }) {
  const mesh = useRef<THREE.Points>(null);
  const lines = useRef<THREE.LineSegments>(null);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    const orange = new THREE.Color("#ff6b35");
    const blue = new THREE.Color("#3b82f6");
    const purple = new THREE.Color("#a855f7");
    const warm = new THREE.Color("#f59e0b");
    const palette = [orange, blue, purple, warm];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;

      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      speeds[i] = 0.2 + Math.random() * 0.5;
    }
    return { positions, colors, speeds };
  }, [count]);

  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const maxLines = count * 3;
    const linePositions = new Float32Array(maxLines * 6);
    const lineColors = new Float32Array(maxLines * 6);
    geo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(lineColors, 3));
    geo.setDrawRange(0, 0);
    return geo;
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    const positions = mesh.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime;
    const scrollFactor = scrollY * 0.0005;

    for (let i = 0; i < count; i++) {
      const speed = particles.speeds[i];
      positions[i * 3] += Math.sin(time * speed + i) * 0.002;
      positions[i * 3 + 1] += Math.cos(time * speed * 0.7 + i * 0.5) * 0.002 + scrollFactor * 0.01;
      positions[i * 3 + 2] += Math.sin(time * speed * 0.3 + i * 0.3) * 0.001;
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;

    if (!lines.current) return;
    const linePositions = lineGeometry.attributes.position.array as Float32Array;
    const lineColors = lineGeometry.attributes.color.array as Float32Array;
    let lineIdx = 0;
    const threshold = 2.5 + scrollFactor * 2;

    for (let i = 0; i < count && lineIdx < count * 3; i++) {
      for (let j = i + 1; j < count && lineIdx < count * 3; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < threshold) {
          const alpha = 1 - dist / threshold;
          linePositions[lineIdx * 6] = positions[i * 3];
          linePositions[lineIdx * 6 + 1] = positions[i * 3 + 1];
          linePositions[lineIdx * 6 + 2] = positions[i * 3 + 2];
          linePositions[lineIdx * 6 + 3] = positions[j * 3];
          linePositions[lineIdx * 6 + 4] = positions[j * 3 + 1];
          linePositions[lineIdx * 6 + 5] = positions[j * 3 + 2];

          const g = alpha * 0.15;
          lineColors[lineIdx * 6] = g;
          lineColors[lineIdx * 6 + 1] = g * 0.7;
          lineColors[lineIdx * 6 + 2] = g * 1.2;
          lineColors[lineIdx * 6 + 3] = g;
          lineColors[lineIdx * 6 + 4] = g * 0.7;
          lineColors[lineIdx * 6 + 5] = g * 1.2;

          lineIdx++;
        }
      }
    }
    lineGeometry.setDrawRange(0, lineIdx * 2);
    lineGeometry.attributes.position.needsUpdate = true;
    lineGeometry.attributes.color.needsUpdate = true;
  });

  return (
    <>
      <points ref={mesh}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[particles.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.04} vertexColors transparent opacity={0.8} sizeAttenuation depthWrite={false} />
      </points>
      <lineSegments ref={lines} geometry={lineGeometry}>
        <lineBasicMaterial vertexColors transparent opacity={0.3} depthWrite={false} />
      </lineSegments>
    </>
  );
}

export default function ParticleField() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="absolute inset-0 z-0"
      style={{
        opacity: Math.max(0, 1 - scrollY / 1200),
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.3} />
        <Particles scrollY={scrollY} />
      </Canvas>
    </div>
  );
}
