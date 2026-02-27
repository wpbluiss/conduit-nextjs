"use client";
import dynamic from "next/dynamic";
const NodeGraph = dynamic(() => import("./NodeGraph"), { ssr: false });
export default function JourneyPage() { return <NodeGraph />; }
