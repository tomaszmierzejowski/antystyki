// Background templates for antistics
export interface BackgroundTemplate {
  id: string;
  name: string;
  namePl: string;
  gradient: string;
  preview: string;
}

export const backgroundTemplates: BackgroundTemplate[] = [
  {
    id: 'ocean',
    name: 'Ocean Blue',
    namePl: 'Błękit Oceanu',
    gradient: 'from-blue-500 via-cyan-500 to-teal-500',
    preview: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #14b8a6 100%)'
  },
  {
    id: 'sunset',
    name: 'Sunset',
    namePl: 'Zachód Słońca',
    gradient: 'from-orange-500 via-red-500 to-pink-500',
    preview: 'linear-gradient(135deg, #f97316 0%, #ef4444 50%, #ec4899 100%)'
  },
  {
    id: 'forest',
    name: 'Forest Green',
    namePl: 'Leśna Zieleń',
    gradient: 'from-green-600 via-emerald-500 to-teal-600',
    preview: 'linear-gradient(135deg, #16a34a 0%, #10b981 50%, #0d9488 100%)'
  },
  {
    id: 'purple',
    name: 'Purple Dream',
    namePl: 'Fioletowy Sen',
    gradient: 'from-purple-600 via-violet-500 to-indigo-600',
    preview: 'linear-gradient(135deg, #9333ea 0%, #8b5cf6 50%, #4f46e5 100%)'
  },
  {
    id: 'fire',
    name: 'Fire',
    namePl: 'Ogień',
    gradient: 'from-red-600 via-orange-600 to-yellow-500',
    preview: 'linear-gradient(135deg, #dc2626 0%, #ea580c 50%, #eab308 100%)'
  },
  {
    id: 'midnight',
    name: 'Midnight',
    namePl: 'Północ',
    gradient: 'from-slate-900 via-purple-900 to-slate-900',
    preview: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)'
  },
  {
    id: 'candy',
    name: 'Candy',
    namePl: 'Cukierek',
    gradient: 'from-pink-400 via-rose-400 to-red-400',
    preview: 'linear-gradient(135deg, #f472b6 0%, #fb7185 50%, #f87171 100%)'
  },
  {
    id: 'mint',
    name: 'Fresh Mint',
    namePl: 'Świeża Mięta',
    gradient: 'from-cyan-400 via-teal-400 to-green-400',
    preview: 'linear-gradient(135deg, #22d3ee 0%, #2dd4bf 50%, #4ade80 100%)'
  },
  {
    id: 'gold',
    name: 'Golden Hour',
    namePl: 'Złota Godzina',
    gradient: 'from-yellow-500 via-amber-500 to-orange-500',
    preview: 'linear-gradient(135deg, #eab308 0%, #f59e0b 50%, #f97316 100%)'
  },
  {
    id: 'berry',
    name: 'Berry Blast',
    namePl: 'Jagodowy Wybuch',
    gradient: 'from-fuchsia-600 via-purple-600 to-violet-600',
    preview: 'linear-gradient(135deg, #c026d3 0%, #9333ea 50%, #7c3aed 100%)'
  }
];

export const getBackgroundByKey = (key?: string): BackgroundTemplate => {
  if (!key) return backgroundTemplates[0];
  return backgroundTemplates.find(bg => bg.id === key) || backgroundTemplates[0];
};

