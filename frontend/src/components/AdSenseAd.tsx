import { useEffect } from 'react';

type AdsByGoogleQueue = Array<Record<string, unknown>>;

declare global {
  interface Window {
    adsbygoogle?: AdsByGoogleQueue;
  }
}

interface AdSenseAdProps {
  adSlot: string;
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  fullWidthResponsive?: boolean;
  className?: string;
}

/**
 * Google AdSense Ad Component
 * 
 * Setup Instructions:
 * 1. Apply for Google AdSense: https://www.google.com/adsense/
 * 2. Get your Publisher ID (ca-pub-XXXXXXXXXXXXXXXX)
 * 3. Create ad units and get Ad Slot IDs
 * 4. Update VITE_ADSENSE_PUBLISHER_ID in .env
 * 5. Add AdSense script to index.html
 * 
 * Usage:
 * <AdSenseAd adSlot="1234567890" adFormat="auto" />
 */
const AdSenseAd: React.FC<AdSenseAdProps> = ({
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  className = '',
}) => {
  const publisherId = import.meta.env.VITE_ADSENSE_PUBLISHER_ID;

  useEffect(() => {
    if (!publisherId || publisherId === 'PLACEHOLDER') {
      return;
    }

    const scriptId = 'adsbygoogle-init';
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!existingScript) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    try {
      const queue: AdsByGoogleQueue = window.adsbygoogle ?? [];
      queue.push({});
      window.adsbygoogle = queue;
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, [publisherId]);

  if (!publisherId || publisherId === 'PLACEHOLDER') {
    return null;
  }

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={publisherId}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive.toString()}
      ></ins>
    </div>
  );
};

export default AdSenseAd;

