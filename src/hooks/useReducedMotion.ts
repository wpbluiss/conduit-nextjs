"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void): () => void {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  // Treat missing IntersectionObserver identically to prefers-reduced-motion:
  // without IO, whileInView elements never leave their initial hidden state in
  // screenshot/headless contexts, so we skip the animation entirely.
  if (!('IntersectionObserver' in window)) return true;
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Single source for prefers-reduced-motion gating across the Praxis
 * console. SSR-safe (returns false on the server), subscribes to
 * preference changes so toggling the OS setting takes effect
 * without a reload.
 *
 * Per spec FR-059 / R-010 — every JS-side motion decision in the
 * redesigned surfaces (canvas-tint provider, page-transition
 * trigger, ship-celebration detector) MUST consult this hook.
 * CSS-side keyframes use the equivalent media query directly.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
