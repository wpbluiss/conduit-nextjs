'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function getCookie(name) {
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name + '=([^;]*)')
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export default function AffiliateLinker() {
  const pathname = usePathname();

  useEffect(() => {
    const ref = getCookie('affiliate_ref');
    if (!ref) return;

    const links = document.querySelectorAll('a[href*="app.conduitai.io"]');
    links.forEach((link) => {
      try {
        const url = new URL(link.href);
        if (!url.searchParams.has('ref')) {
          url.searchParams.set('ref', ref);
          link.href = url.toString();
        }
      } catch {
        // skip malformed hrefs
      }
    });
  }, [pathname]);

  return null;
}
