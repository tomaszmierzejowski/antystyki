import React, { useEffect } from 'react';

interface AdSlotProps {
    slotId: string;
    format?: 'auto' | 'fluid' | 'rectangle';
    className?: string;
    style?: React.CSSProperties;
}

const AdSlot: React.FC<AdSlotProps> = ({ slotId, format = 'auto', className = '', style = {} }) => {
    useEffect(() => {
        try {
            if (import.meta.env.PROD) {
                ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
            }
        } catch (e) {
            console.error('AdSense error:', e);
        }
    }, []);

    if (import.meta.env.DEV) {
        return (
            <div
                className={`bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center text-gray-400 text-sm p-4 ${className}`}
                style={{ minHeight: '100px', ...style }}
            >
                <div className="text-center">
                    <p className="font-semibold">AdSense Slot</p>
                    <p className="text-xs">{slotId}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`ad-container ${className}`} style={style}>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider text-center mb-1">Reklama</div>
            <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client={import.meta.env.VITE_ADSENSE_PUBLISHER_ID || "ca-pub-YOUR_PUBLISHER_ID"}
                data-ad-slot={slotId}
                data-ad-format={format}
                data-full-width-responsive="true"
            />
        </div>
    );
};

export default AdSlot;
