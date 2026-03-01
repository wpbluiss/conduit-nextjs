'use client';
import { track } from '@vercel/analytics';

export default function TrackClick({ event, properties, children }) {
  return (
    <span onClick={() => track(event, properties)} style={{ display: 'contents' }}>
      {children}
    </span>
  );
}
