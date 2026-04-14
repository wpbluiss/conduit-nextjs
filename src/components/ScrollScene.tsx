"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* ───────────────────────── shared scroll state ───────────────────────── */
// Mutable ref object shared between GSAP (DOM) and R3F (WebGL)
export const scrollState = { progress: 0 };

/* ───────────────────────── Spatial grid for neighbor lookup ──────────── */
// Replaces O(n^2) brute-force with grid-based spatial hashing
const GRID_CELL_SIZE = 3.0; // slightly larger than connection threshold

function hashCell(cx: number, cy: number, cz: number): number {
  // Simple spatial hash
  return ((cx * 92837111) ^ (cy * 689287499) ^ (cz * 283923481)) | 0;
}

function buildSpatialGrid(positions: Float32Array, count: number, cellSize: number) {
  const grid = new Map<number, number[]>();
  for (let i = 0; i < count; i++) {
    const cx = Math.floor(positions[i * 3] / cellSize);
    const cy = Math.floor(positions[i * 3 + 1] / cellSize);
    const cz = Math.floor(positions[i * 3 + 2] / cellSize);
    const key = hashCell(cx, cy, cz);
    let bucket = grid.get(key);
    if (!bucket) { bucket = []; grid.set(key, bucket); }
    bucket.push(i);
  }
  return grid;
}

function* getNeighborCells(cx: number, cy: number, cz: number) {
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        yield hashCell(cx + dx, cy + dy, cz + dz);
      }
    }
  }
}

/* ───────────────────────── Neural-net particles ─────────────────────── */
function Particles({ count = 120 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null);
  const lines = useRef<THREE.LineSegments>(null);
  const frameCount = useRef(0);

  const data = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const palette = [
      new THREE.Color("#ff6b35"),
      new THREE.Color("#3b82f6"),
      new THREE.Color("#a855f7"),
      new THREE.Color("#f59e0b"),
      new THREE.Color("#6366f1"),
    ];
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      spd[i] = 0.15 + Math.random() * 0.4;
    }
    return { pos, col, spd };
  }, [count]);

  const lineGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const maxL = count * 3; // reduced from count*4
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(maxL * 6), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(maxL * 6), 3));
    g.setDrawRange(0, 0);
    return g;
  }, [count]);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const p = mesh.current.geometry.attributes.position.array as Float32Array;
    const t = clock.elapsedTime;
    const sp = scrollState.progress;

    for (let i = 0; i < count; i++) {
      const s = data.spd[i];
      p[i * 3]     += Math.sin(t * s + i) * 0.003;
      p[i * 3 + 1] += Math.cos(t * s * 0.7 + i * 0.5) * 0.003;
      p[i * 3 + 2] += Math.sin(t * s * 0.3 + i * 0.3) * 0.002;
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;

    // Connection lines — only update every 3rd frame for performance
    frameCount.current++;
    if (!lines.current || frameCount.current % 3 !== 0) return;

    const lp = lineGeo.attributes.position.array as Float32Array;
    const lc = lineGeo.attributes.color.array as Float32Array;
    let li = 0;
    const maxL = count * 3;
    const thresh = 2.2 + sp * 1.5;
    const threshSq = thresh * thresh; // avoid sqrt — compare squared distances

    // Build spatial grid for this frame
    const grid = buildSpatialGrid(p, count, GRID_CELL_SIZE);

    // Track which pairs we have already checked to avoid duplicates
    const visited = new Set<number>();

    for (let i = 0; i < count && li < maxL; i++) {
      const px = p[i * 3], py = p[i * 3 + 1], pz = p[i * 3 + 2];
      const cx = Math.floor(px / GRID_CELL_SIZE);
      const cy = Math.floor(py / GRID_CELL_SIZE);
      const cz = Math.floor(pz / GRID_CELL_SIZE);

      for (const cellKey of getNeighborCells(cx, cy, cz)) {
        const bucket = grid.get(cellKey);
        if (!bucket) continue;
        for (let bi = 0; bi < bucket.length && li < maxL; bi++) {
          const j = bucket[bi];
          if (j <= i) continue; // only check each pair once
          // Unique pair key for dedup (handles cross-cell duplicates)
          const pairKey = i * count + j;
          if (visited.has(pairKey)) continue;
          visited.add(pairKey);

          const dx = px - p[j * 3], dy = py - p[j * 3 + 1], dz = pz - p[j * 3 + 2];
          const dSq = dx * dx + dy * dy + dz * dz;
          if (dSq < threshSq) {
            const d = Math.sqrt(dSq);
            const a = (1 - d / thresh) * 0.2;
            lp[li*6]=px; lp[li*6+1]=py; lp[li*6+2]=pz;
            lp[li*6+3]=p[j*3]; lp[li*6+4]=p[j*3+1]; lp[li*6+5]=p[j*3+2];
            lc[li*6]=a*0.9; lc[li*6+1]=a*0.5; lc[li*6+2]=a*1.2;
            lc[li*6+3]=a*0.9; lc[li*6+4]=a*0.5; lc[li*6+5]=a*1.2;
            li++;
          }
        }
      }
    }
    lineGeo.setDrawRange(0, li * 2);
    lineGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.color.needsUpdate = true;
  });

  return (
    <>
      <points ref={mesh}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
          <bufferAttribute attach="attributes-color" args={[data.col, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.05} vertexColors transparent opacity={0.85} sizeAttenuation depthWrite={false} />
      </points>
      <lineSegments ref={lines} geometry={lineGeo}>
        <lineBasicMaterial vertexColors transparent opacity={0.35} depthWrite={false} />
      </lineSegments>
    </>
  );
}

/* ───────────────────────── Building ─────────────────────────────────── */
const DEPTS = [
  { name: "Engineering", color: "#ff6b35", agents: 47 },
  { name: "Sales",       color: "#3b82f6", agents: 31 },
  { name: "Marketing",   color: "#f59e0b", agents: 24 },
  { name: "Support",     color: "#00c9ff", agents: 38 },
  { name: "Finance",     color: "#a855f7", agents: 19 },
  { name: "HR",          color: "#f59e0b", agents: 15 },
  { name: "Legal",       color: "#ef4444", agents: 12 },
  { name: "Operations",  color: "#6366f1", agents: 28 },
  { name: "Product",     color: "#3b82f6", agents: 22 },
];

function Floor({ index, dept }: { index: number; dept: typeof DEPTS[0] }) {
  const ref = useRef<THREE.Group>(null);
  const y = index * 0.55 - 2.2;
  const col = useMemo(() => new THREE.Color(dept.color), [dept.color]);
  const edgeGeo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(3, 0.08, 2)), []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = y + Math.sin(clock.elapsedTime * 0.5 + index * 0.4) * 0.03;
    // Engineering floor glow handled by point light — no per-frame material iteration needed
  });

  return (
    <group ref={ref} position={[0, y, 0]}>
      <mesh>
        <boxGeometry args={[3, 0.08, 2]} />
        <meshStandardMaterial color="#0e0e18" transparent opacity={0.9} metalness={0.5} roughness={0.3} />
      </mesh>
      <lineSegments geometry={edgeGeo}>
        <lineBasicMaterial color={col} transparent opacity={0.5} />
      </lineSegments>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[2.9, 0.36, 1.9]} />
        <meshStandardMaterial color={dept.color} transparent opacity={0.06} metalness={0.8} roughness={0.1} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[2.6, 0.02, 0.02]} />
        <meshBasicMaterial color={dept.color} transparent opacity={0.8} />
      </mesh>
      {Array.from({ length: Math.min(Math.floor(dept.agents / 5), 6) }).map((_, i) => (
        <mesh key={i} position={[-1 + i * 0.5, 0.12, -0.5 + (i % 2) * 1]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color={dept.color} />
        </mesh>
      ))}
      <pointLight color={dept.color} intensity={0.15} distance={2} position={[0, 0.3, 0]} />
    </group>
  );
}

/* ───────────────────────── Camera controller ────────────────────────── */
function CameraRig() {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const sp = scrollState.progress;

    if (sp < 0.12) {
      // Phase 1: wide view
      pos.set(0, 1, 7);
      target.set(0, 0, 0);
    } else if (sp < 0.25) {
      // Phase 2: push into building
      const t = (sp - 0.12) / 0.13;
      pos.set(
        THREE.MathUtils.lerp(0, 1.2, t),
        THREE.MathUtils.lerp(1, 3, t),
        THREE.MathUtils.lerp(7, 3.5, t)
      );
      target.set(0, THREE.MathUtils.lerp(0, 1.5, t), 0);
    } else if (sp < 0.35) {
      // Phase 3: zoom to Engineering floor (top)
      const t = (sp - 0.25) / 0.1;
      pos.set(
        THREE.MathUtils.lerp(1.2, 0.8, t),
        THREE.MathUtils.lerp(3, 3.2, t),
        THREE.MathUtils.lerp(3.5, 2, t)
      );
      target.set(0, THREE.MathUtils.lerp(1.5, 2.5, t), 0);
    } else if (sp < 0.55) {
      // Phase 4: orbit AI employee
      const t = (sp - 0.35) / 0.2;
      const angle = t * Math.PI * 0.8 - 0.4;
      pos.set(
        Math.sin(angle) * 1.8,
        THREE.MathUtils.lerp(3.2, 3, t),
        Math.cos(angle) * 1.8
      );
      target.set(0, 2.6, 0);
    } else if (sp < 0.65) {
      // Phase 5: zoom into work (employee monitor view)
      const t = (sp - 0.55) / 0.1;
      pos.set(
        THREE.MathUtils.lerp(Math.sin(0.4) * 1.8, 0.3, t),
        THREE.MathUtils.lerp(3, 2.8, t),
        THREE.MathUtils.lerp(Math.cos(0.4) * 1.8, 0.8, t)
      );
      target.set(0, THREE.MathUtils.lerp(2.6, 2.6, t), 0);
    } else if (sp < 0.75) {
      // Phase 6: pull back to CEO suite — wide top-down
      const t = (sp - 0.65) / 0.1;
      pos.set(
        THREE.MathUtils.lerp(0.3, 0, t),
        THREE.MathUtils.lerp(2.8, 5, t),
        THREE.MathUtils.lerp(0.8, 4, t)
      );
      target.set(0, THREE.MathUtils.lerp(2.6, 0.5, t), 0);
    } else {
      // Phase 7+: hold wide top-down, building fades
      pos.set(0, 5, 4);
      target.set(0, 0.5, 0);
    }

    camera.position.lerp(pos, 0.08);
    camera.lookAt(target);
  });

  return null;
}

function Building() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.PI / 6 + Math.sin(clock.elapsedTime * 0.08) * 0.04;
    // Fade building for terminal/grid phases
    const sp = scrollState.progress;
    const fade = sp > 0.75 ? Math.max(0, 1 - (sp - 0.75) / 0.1) : 1;
    groupRef.current.children.forEach(c => {
      if ((c as THREE.Mesh).material) {
        ((c as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = fade;
      }
    });
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

      {DEPTS.map((d, i) => <Floor key={d.name} index={i} dept={d} />)}

      <mesh position={[0, -2.7, 0]}>
        <boxGeometry args={[3.5, 0.05, 2.5]} />
        <meshStandardMaterial color="#0a0a12" metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  );
}

/* ───── Throttle rendering when tab hidden or canvas off-screen ───────── */
function FrameThrottle() {
  const { invalidate, clock } = useThree();
  const visible = useRef(true);
  const inViewport = useRef(true);
  const frameSkip = useRef(0);

  useEffect(() => {
    const onVis = () => {
      visible.current = document.visibilityState === "visible";
      if (visible.current) invalidate();
    };
    document.addEventListener("visibilitychange", onVis);

    // Observe whether the canvas is in the viewport
    const canvas = document.querySelector("canvas");
    let observer: IntersectionObserver | null = null;
    if (canvas) {
      observer = new IntersectionObserver(
        ([entry]) => { inViewport.current = entry.isIntersecting; },
        { threshold: 0.05 }
      );
      observer.observe(canvas);
    }

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      observer?.disconnect();
    };
  }, [invalidate]);

  useFrame(() => {
    if (!visible.current) { clock.stop(); return; }
    if (!clock.running) clock.start();

    // When canvas is not in viewport, throttle to ~15fps (skip every other frame)
    if (!inViewport.current) {
      frameSkip.current++;
      if (frameSkip.current % 2 !== 0) return;
    }
  });

  return null;
}

/* ───────────────────────── Exported canvas ───────────────────────────── */
export default function ScrollScene() {
  return (
    <Canvas
      camera={{ position: [0, 1, 7], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
      resize={{ debounce: 100 }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 5]} intensity={0.4} />
      <directionalLight position={[-3, 4, -2]} intensity={0.2} color="#ff6b35" />
      <fog attach="fog" args={["#050508", 8, 20]} />
      <FrameThrottle />
      <CameraRig />
      <Building />
      <Particles count={120} />
    </Canvas>
  );
}
