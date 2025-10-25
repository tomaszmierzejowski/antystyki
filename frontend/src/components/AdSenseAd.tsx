import { useEffect } from 'react';

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
    // Only load ads if publisher ID is configured
    if (publisherId && publisherId !== 'PLACEHOLDER') {
      try {
        // @ts-ignore - AdSense global object
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error('AdSense error:', error);
      }
    }
  }, [publisherId]);

  // Don't render if AdSense is not configured
  if (!publisherId || publisherId === 'PLACEHOLDER') {
    return (
      <div className={`bg-gray-100 border border-gray-300 rounded-lg p-4 text-center ${className}`}>
        <p className="text-sm text-gray-500">
          📢 Ad space (AdSense not configured)
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Set VITE_ADSENSE_PUBLISHER_ID to enable
        </p>
      </div>
    );
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

