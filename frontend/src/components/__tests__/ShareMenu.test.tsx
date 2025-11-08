import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';

const analyticsMock = vi.hoisted(() => ({
  trackShareInitiated: vi.fn(),
  trackSharePlatform: vi.fn(),
  trackShareCompleted: vi.fn(),
}));

const clipboardMock = vi.hoisted(() => ({
  copyToClipboard: vi.fn(async () => Promise.resolve()),
}));

vi.mock('../../utils/analytics', () => analyticsMock);
vi.mock('../../utils/clipboard', () => clipboardMock);

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShareMenu from '../ShareMenu';

const { trackShareInitiated, trackSharePlatform, trackShareCompleted } = analyticsMock;
const { copyToClipboard } = clipboardMock;

const baseProps = {
  canonicalUrl: 'https://antystyki.pl/statistics/test-123',
  entityId: 'test-entity-id',
  entityType: 'statistic' as const,
  title: 'Czy dwie strony mogą mieć rację?',
  summary: '64% ankietowanych twierdzi, że dane bez kontekstu mijają się z prawdą.',
};

describe('ShareMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens the menu and emits analytics when toggled', async () => {
    render(<ShareMenu {...baseProps} />);

    await userEvent.click(screen.getByTestId('share-trigger'));

    expect(trackShareInitiated).toHaveBeenCalledWith('statistic', 'test-entity-id');
    expect(await screen.findByTestId('share-menu')).toBeVisible();
  });

  it('copies link payload with UTM parameters and reports completion', async () => {
    render(<ShareMenu {...baseProps} />);
    await userEvent.click(screen.getByTestId('share-trigger'));

    await userEvent.click(screen.getByRole('button', { name: /Skopiuj link/i }));

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalled();
    });

    const copyCalls = vi.mocked(copyToClipboard).mock.calls;
    const firstCopyCall = copyCalls[0];
    expect(firstCopyCall).toBeDefined();
    const [payload = ''] = firstCopyCall ?? [];
    expect(payload).toContain('utm_source=copy-link');
    expect(payload).toContain('share_button_v1');

    expect(trackSharePlatform).toHaveBeenCalledWith('statistic', 'test-entity-id', 'copy-link');
    expect(trackShareCompleted).toHaveBeenCalledWith('statistic', 'test-entity-id', 'copy-link');
    expect(screen.getByRole('status')).toHaveTextContent('Misja! Link z kontekstem skopiowany do schowka.');
  });

  it('uses the native share sheet when available', async () => {
    const shareSpy = vi.fn().mockResolvedValue(undefined);
    const originalShare = navigator.share;
    Object.defineProperty(navigator, 'share', {
      value: shareSpy,
      configurable: true,
      writable: true,
    });

    render(<ShareMenu {...baseProps} />);
    await userEvent.click(screen.getByTestId('share-trigger'));
    await userEvent.click(screen.getByRole('button', { name: /Udostępnij przez urządzenie/i }));

    await waitFor(() => {
      expect(shareSpy).toHaveBeenCalled();
    });

    const payload = shareSpy.mock.calls[0][0];
    expect(payload.url).toContain('utm_source=native');
    expect(payload.url).toContain('share_sheet');
    expect(payload.text).toContain('Mission reminder');

    expect(trackSharePlatform).toHaveBeenCalledWith('statistic', 'test-entity-id', 'native');
    expect(trackShareCompleted).toHaveBeenCalledWith('statistic', 'test-entity-id', 'native');

    Object.defineProperty(navigator, 'share', {
      value: originalShare,
      configurable: true,
      writable: true,
    });
  });

  it('copies stat payload when requested', async () => {
    render(<ShareMenu {...baseProps} statCopyText="Statystyka z szerszym kontekstem" />);
    await userEvent.click(screen.getByTestId('share-trigger'));

    await userEvent.click(screen.getByRole('button', { name: /Skopiuj treść/i }));

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalled();
    });

    const copyCalls = vi.mocked(copyToClipboard).mock.calls;
    const firstCopyCall = copyCalls[0];
    expect(firstCopyCall).toBeDefined();
    const [payload = ''] = firstCopyCall ?? [];
    expect(payload.split('\n')[0]).toBe('Statystyka z szerszym kontekstem');
    expect(payload).toContain('utm_source=copy-stat');
    expect(trackShareCompleted).toHaveBeenCalledWith('statistic', 'test-entity-id', 'copy-stat');
  });
});

describe('ShareMenu (mobile layout)', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    });
  });

  it('renders bottom sheet on mobile viewports', async () => {
    render(<ShareMenu {...baseProps} />);

    await userEvent.click(screen.getByTestId('share-trigger'));

    expect(await screen.findByRole('dialog')).toBeVisible();
    expect(screen.getByLabelText('Zamknij panel udostępniania')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Skopiuj link/i })).toBeInTheDocument();
  });
});


