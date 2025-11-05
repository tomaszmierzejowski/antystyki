const MISSION_PL = 'Antystyki zamienia prawdziwe statystyki w ironiczne historie ze strefy szarości, które zachęcają do głębszego myślenia przed udostępnieniem.';
const MISSION_EN = 'Antystyki turns real stats into witty gray-area stories that help our community think deeper before they share.';
const NUANCE_REMINDER_PL = 'Misja Antystyki: mniej clickbaitu, więcej rozmów w odcieniach szarości.';
const NUANCE_REMINDER_EN = 'Mission reminder: trade clickbait for thoughtful grey-area conversations.';

export type ShareEntityType = 'statistic' | 'antistic';

export type SharePlatform =
  | 'facebook'
  | 'twitter'
  | 'linkedin'
  | 'whatsapp'
  | 'messenger'
  | 'copy-link'
  | 'copy-stat';

export interface MissionShareOptions {
  title: string;
  summary: string;
  canonicalUrl: string;
  entityType: ShareEntityType;
  statCopyOverride?: string;
}

export interface MissionShareMessage {
  defaultText: string;
  platformText: Partial<Record<SharePlatform | 'facebook', string>>;
  buildClipboardText: (trackedUrl: string) => string;
  buildStatClipboardText: (trackedUrl: string) => string;
}

const truncateWithEllipsis = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
};

export const buildMissionShareMessage = (options: MissionShareOptions): MissionShareMessage => {
  const trimmedTitle = options.title.trim();
  const trimmedSummary = options.summary.trim();
  const baseThought = [trimmedTitle, trimmedSummary]
    .filter((value, index) => value.length > 0 && (index === 0 || value !== trimmedTitle))
    .join(' — ');
  const thoughtLine = baseThought.length > 0 ? baseThought : trimmedTitle || options.summary;

  const defaultText = `${thoughtLine}. ${MISSION_EN} ${NUANCE_REMINDER_EN}`;
  const facebookQuote = truncateWithEllipsis(`${thoughtLine}. ${MISSION_EN} ${NUANCE_REMINDER_EN}`, 200)
    .replace(/\s+/g, ' ')
    .trim();

  const buildClipboardText = (trackedUrl: string) => [
    thoughtLine,
    `PL: ${MISSION_PL}`,
    `EN: ${MISSION_EN}`,
    NUANCE_REMINDER_PL,
    NUANCE_REMINDER_EN,
    trackedUrl,
  ].join('\n');

  const statSource = options.statCopyOverride?.trim() ?? options.summary.trim();
  const buildStatClipboardText = (trackedUrl: string) => [
    statSource,
    NUANCE_REMINDER_PL,
    NUANCE_REMINDER_EN,
    trackedUrl,
  ].join('\n');

  const platformText: MissionShareMessage['platformText'] = {
    facebook: facebookQuote,
    twitter: truncateWithEllipsis(`${thoughtLine}. ${MISSION_EN} ${NUANCE_REMINDER_EN}`, 240),
    whatsapp: `${thoughtLine}\n${MISSION_PL}\n${NUANCE_REMINDER_PL}`,
    messenger: `${thoughtLine}. ${MISSION_PL} ${NUANCE_REMINDER_PL}`,
  };

  return {
    defaultText,
    platformText,
    buildClipboardText,
    buildStatClipboardText,
  };
};

export const withShareTracking = (canonicalUrl: string, platform: SharePlatform | 'native', medium: string = 'social_share'): string => {
  try {
    const hasAbsolute = /^https?:\/\//i.test(canonicalUrl);
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://antystyki.pl';
    const url = hasAbsolute ? new URL(canonicalUrl) : new URL(canonicalUrl, base);
    url.searchParams.set('utm_source', platform);
    url.searchParams.set('utm_medium', medium);
    url.searchParams.set('utm_campaign', 'share_button_v1');
    return url.toString();
  } catch (error) {
    console.warn('Unable to build tracked share URL', error);
    return canonicalUrl;
  }
};

export interface ShareActionPayload {
  canonicalUrl: string;
  message: MissionShareMessage;
}

export type ShareActionType = 'link' | 'copy-link' | 'copy-stat';

export interface ShareActionDefinition {
  id: SharePlatform;
  label: string;
  description: string;
  icon: string;
  type: ShareActionType;
  buildUrl?: (payload: ShareActionPayload) => string;
}

const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;

export const SHARE_ACTIONS: ShareActionDefinition[] = [
  {
    id: 'copy-link',
    label: 'Skopiuj link',
    description: 'Skopiuj link do schowka',
    icon: '🔗',
    type: 'copy-link',
  },
  {
    id: 'copy-stat',
    label: 'Skopiuj treść',
    description: 'Skopiuj statystykę z misją',
    icon: '📝',
    type: 'copy-stat',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    description: 'Udostępnij na Facebooku',
    icon: '📘',
    type: 'link',
    buildUrl: ({ canonicalUrl, message }) => {
      const trackedUrl = withShareTracking(canonicalUrl, 'facebook');
      const quote = message.platformText.facebook ?? message.defaultText;
      const params = new URLSearchParams({
        u: trackedUrl,
        quote,
      });
      return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
    },
  },
  {
    id: 'twitter',
    label: 'X / Twitter',
    description: 'Udostępnij w serwisie X',
    icon: '𝕏',
    type: 'link',
    buildUrl: ({ canonicalUrl, message }) => {
      const trackedUrl = withShareTracking(canonicalUrl, 'twitter');
      const text = message.platformText.twitter ?? message.defaultText;
      return `https://twitter.com/intent/tweet?url=${encodeURIComponent(trackedUrl)}&text=${encodeURIComponent(text)}`;
    },
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    description: 'Udostępnij profesjonalnej sieci',
    icon: '💼',
    type: 'link',
    buildUrl: ({ canonicalUrl }) => {
      const trackedUrl = withShareTracking(canonicalUrl, 'linkedin');
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(trackedUrl)}`;
    },
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    description: 'Udostępnij rozmówcom w WhatsAppie',
    icon: '💬',
    type: 'link',
    buildUrl: ({ canonicalUrl, message }) => {
      const trackedUrl = withShareTracking(canonicalUrl, 'whatsapp');
      const text = `${message.platformText.whatsapp ?? message.defaultText}
${trackedUrl}`.trim();
      return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    },
  },
  {
    id: 'messenger',
    label: 'Messenger',
    description: 'Udostępnij w Messengerze',
    icon: '✉️',
    type: 'link',
    buildUrl: ({ canonicalUrl, message }) => {
      const trackedUrl = withShareTracking(canonicalUrl, 'messenger');
      const baseUrl = 'https://www.messenger.com/share/';
      const params = new URLSearchParams({ link: trackedUrl });
      if (facebookAppId) {
        params.set('app_id', facebookAppId);
      }
      if (message.platformText.messenger) {
        params.set('quote', message.platformText.messenger);
      }
      return `${baseUrl}?${params.toString()}`;
    },
  },
];

const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const extractIdFromSlug = (slugParam: string): string | null => {
  if (!slugParam) {
    return null;
  }

  const trimmed = slugParam.trim();
  if (GUID_PATTERN.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.length >= 36) {
    const candidate = trimmed.slice(-36);
    if (GUID_PATTERN.test(candidate)) {
      return candidate;
    }
  }

  return null;
};


