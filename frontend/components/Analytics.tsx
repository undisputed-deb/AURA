'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { pageview, GA_MEASUREMENT_ID } from '@/lib/gtag';
import Script from 'next/script';

function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    // Strip dynamic segments (IDs) from paths before sending to analytics
    const sanitizedPath = pathname.replace(/\/[a-zA-Z0-9_-]{20,}/g, '/[id]');
    pageview(sanitizedPath);
  }, [pathname, searchParams]);

  return null;
}

export default function Analytics() {
  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: [
            'window.dataLayer = window.dataLayer || [];',
            'function gtag(){dataLayer.push(arguments);}',
            'gtag("js", new Date());',
            'gtag("config", "' + GA_MEASUREMENT_ID + '", { page_path: window.location.pathname });',
          ].join('\n'),
        }}
      />
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
    </>
  );
}
