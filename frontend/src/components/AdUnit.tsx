import React, { useEffect, useRef } from 'react';

interface AdUnitProps {
    slotId: string;
    format?: 'auto' | 'fluid' | 'rectangle';
    layoutKey?: string;
    style?: React.CSSProperties;
    className?: string;
}

const AdUnit: React.FC<AdUnitProps> = ({
    slotId,
    format = 'auto',
    layoutKey,
    style,
    className,
}) => {
    const adRef = useRef<HTMLModElement>(null);

    useEffect(() => {
        try {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error('AdSense error:', e);
        }
    }, []);

    return (
        <div className={`ad-container ${className || ''}`} style={style}>
            <ins
                className="adsbygoogle"
                style={{ display: 'block', ...style }}
                data-ad-client="ca-pub-6071951704537451"
                data-ad-slot={slotId}
                data-ad-format={format}
                data-full-width-responsive="true"
                {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
                ref={adRef}
            />
        </div>
    );
};

export default AdUnit;
