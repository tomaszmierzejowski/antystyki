import { describe, expect, it } from 'vitest';
import { buildMissionShareMessage, withShareTracking } from './share';
import { SHARE_ACTIONS } from './share';

describe('withShareTracking', () => {
  it('appends UTM parameters for absolute canonical URLs', () => {
    const result = withShareTracking('https://antystyki.pl/statistics/test-123', 'facebook');
    const url = new URL(result);

    expect(url.searchParams.get('utm_source')).toBe('facebook');
    expect(url.searchParams.get('utm_medium')).toBe('social_share');
    expect(url.searchParams.get('utm_campaign')).toBe('share_button_v1');
  });

  it('falls back to window origin for relative URLs', () => {
    const relative = '/antistics/example-456';
    const result = withShareTracking(relative, 'twitter');
    const url = new URL(result);

    expect(url.origin).toBe(window.location.origin);
    expect(url.pathname).toContain('/antistics/example-456');
    expect(url.searchParams.get('utm_source')).toBe('twitter');
  });
});

describe('buildMissionShareMessage', () => {
  const canonicalUrl = 'https://antystyki.pl/statistics/test-123';

  it('creates nuanced bilingual default text and clipboard builders', () => {
    const message = buildMissionShareMessage({
      title: 'Testowa statystyka',
      summary: '50% młodych dorosłych ufa danym naukowym',
      canonicalUrl,
      entityType: 'statistic',
    });

    expect(message.defaultText).toContain('Mission reminder');
    expect(message.defaultText).toContain('Antystyki');

    const trackedUrl = withShareTracking(canonicalUrl, 'copy-link', 'share_copy');
    const clipboard = message.buildClipboardText(trackedUrl);
    expect(clipboard).toContain('PL:');
    expect(clipboard).toContain('EN:');
    expect(clipboard.toLowerCase()).toContain('mniej clickbaitu');
    expect(clipboard).toContain(trackedUrl);
  });

  it('honours stat copy override when building clipboard text', () => {
    const message = buildMissionShareMessage({
      title: 'Ignorowane statystyki',
      summary: 'Domyślny opis statystyki',
      canonicalUrl,
      entityType: 'antistic',
      statCopyOverride: 'Szokujące? Raczej skłaniające do myślenia.',
    });

    const trackedUrl = withShareTracking(canonicalUrl, 'copy-stat', 'share_copy_stat');
    const statClipboard = message.buildStatClipboardText(trackedUrl);
    expect(statClipboard.split('\n')[0]).toBe('Szokujące? Raczej skłaniające do myślenia.');
    expect(statClipboard).toContain('Antystyki');
    expect(statClipboard).toContain(trackedUrl);
  });

  it('provides nuanced platform text overrides', () => {
    const message = buildMissionShareMessage({
      title: 'Testowa statystyka',
      summary: '50% młodych dorosłych ufa danym naukowym',
      canonicalUrl,
      entityType: 'statistic',
    });

    expect(message.platformText.facebook).toBeDefined();
    expect((message.platformText.facebook ?? '').length).toBeLessThanOrEqual(200);
    expect(message.platformText.twitter).toContain('Mission reminder');
    expect((message.platformText.whatsapp ?? '').toLowerCase()).toContain('mniej clickbaitu');
  });

  it('builds facebook share links with quote parameter', () => {
    const message = buildMissionShareMessage({
      title: 'Dane naukowe',
      summary: '55% osób ufa statystykom',
      canonicalUrl,
      entityType: 'statistic',
    });

    const facebookAction = SHARE_ACTIONS.find((action) => action.id === 'facebook');
    if (!facebookAction || facebookAction.type !== 'link' || !facebookAction.buildUrl) {
      throw new Error('Facebook share action not configured correctly');
    }

    const url = new URL(facebookAction.buildUrl({ canonicalUrl, message }));
    expect(url.searchParams.get('u')).toContain('utm_source=facebook');
    expect(url.searchParams.get('quote')).toContain('Mission reminder');
  });
});


