import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { SHARE_ACTIONS, buildMissionShareMessage, withShareTracking } from '../utils/share';
import type { ShareActionDefinition, ShareEntityType, SharePlatform } from '../utils/share';
import { copyToClipboard } from '../utils/clipboard';
import {
  trackShareCompleted,
  trackShareInitiated,
  trackSharePlatform,
} from '../utils/analytics';

interface ShareMenuProps {
  canonicalUrl: string;
  entityId: string;
  entityType: ShareEntityType;
  title: string;
  summary: string;
  statCopyText?: string;
  disabled?: boolean;
  className?: string;
}

type StatusState = {
  type: 'success' | 'error';
  message: string;
} | null;

const NATIVE_PLATFORM_ID: SharePlatform | 'native' = 'native';

const ShareMenu: React.FC<ShareMenuProps> = ({
  canonicalUrl,
  entityId,
  entityType,
  title,
  summary,
  statCopyText,
  disabled = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<StatusState>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstActionRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const [isMobile, setIsMobile] = useState(false);

  const shareMessage = useMemo(
    () =>
      buildMissionShareMessage({
        title,
        summary,
        canonicalUrl,
        entityType,
        statCopyOverride: statCopyText,
      }),
    [title, summary, canonicalUrl, entityType, statCopyText]
  );

  const nativeShareSupported = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const buttonLabel = entityType === 'statistic' ? 'Udostępnij statystykę' : 'Udostępnij antystyk';

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const media = window.matchMedia('(max-width: 640px)');
    const handleChange = (event?: MediaQueryListEvent) => {
      setIsMobile(event ? event.matches : media.matches);
    };

    handleChange();

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', handleChange);
      return () => media.removeEventListener('change', handleChange);
    }

    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && firstActionRef.current) {
      firstActionRef.current.focus();
    }
  }, [isOpen]);

  const closeMenu = () => {
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const handleToggle = () => {
    if (disabled) {
      return;
    }

    setStatus(null);
    setIsOpen((prev) => {
      const next = !prev;
      if (!prev) {
        trackShareInitiated(entityType, entityId);
      }
      return next;
    });
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
    }
  };

  const markPlatformInteraction = (platform: SharePlatform | 'native') => {
    trackSharePlatform(entityType, entityId, platform);
  };

  const markCompletion = (platform: SharePlatform | 'native') => {
    trackShareCompleted(entityType, entityId, platform);
  };

  const handleShareAction = async (action: ShareActionDefinition) => {
    setStatus(null);
    markPlatformInteraction(action.id);

    try {
      if (action.type === 'link') {
        const url = action.buildUrl?.({ canonicalUrl, message: shareMessage });
        if (!url) {
          throw new Error('Nie udało się przygotować linku do udostępnienia.');
        }

        const opened = window.open(url, '_blank', 'noopener,noreferrer');
        if (!opened) {
          throw new Error('Przeglądarka zablokowała nowe okno udostępniania.');
        }

        markCompletion(action.id);
        setStatus({ type: 'success', message: 'Otwarto okno udostępniania.' });
        closeMenu();
      } else if (action.type === 'copy-link') {
        const tracked = withShareTracking(canonicalUrl, action.id, 'share_copy');
        const payload = shareMessage.buildClipboardText(tracked);
        await copyToClipboard(payload);
        markCompletion(action.id);
        setStatus({ type: 'success', message: 'Misja! Link z kontekstem skopiowany do schowka.' });
        if (firstActionRef.current) {
          firstActionRef.current.focus();
        }
      } else if (action.type === 'copy-stat') {
        const trackedUrl = withShareTracking(canonicalUrl, action.id, 'share_copy_stat');
        const payload = shareMessage.buildStatClipboardText(trackedUrl);
        await copyToClipboard(payload);
        markCompletion(action.id);
        setStatus({ type: 'success', message: 'Treść wraz z misją Antystyki skopiowana do schowka.' });
        if (firstActionRef.current) {
          firstActionRef.current.focus();
        }
      }
    } catch (error) {
      console.error('Share action failed', error);
      setStatus({ type: 'error', message: 'Nie udało się wykonać akcji. Spróbuj ponownie.' });
      if (action.type === 'link') {
        closeMenu();
      } else if (firstActionRef.current) {
        firstActionRef.current.focus();
      }
    }
  };

  const handleNativeShare = async () => {
    if (!nativeShareSupported || disabled) {
      return;
    }

    setStatus(null);
    markPlatformInteraction(NATIVE_PLATFORM_ID);

    try {
      const trackedUrl = withShareTracking(canonicalUrl, NATIVE_PLATFORM_ID, 'share_sheet');
      await navigator.share({
        title,
        text: shareMessage.defaultText,
        url: trackedUrl,
      });
      markCompletion(NATIVE_PLATFORM_ID);
      setStatus({ type: 'success', message: 'Udostępniono z arkusza udostępniania urządzenia.' });
      closeMenu();
    } catch (error: unknown) {
      if ((error as { name?: string })?.name === 'AbortError') {
        setStatus({ type: 'error', message: 'Udostępnianie zostało anulowane.' });
      } else {
        console.error('Native share failed', error);
        setStatus({ type: 'error', message: 'Nie udało się otworzyć arkusza udostępniania.' });
      }
    }
  };

  const menuClasses = `absolute left-1/2 z-30 mt-2 w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-gray-200 bg-white shadow-lg focus:outline-none sm:left-auto sm:right-0 sm:translate-x-0 sm:w-72`;
  const buttonClasses = `inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
    disabled
      ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:text-gray-900 focus-visible:ring-gray-400'
  }`;

  const actionButtonClasses = isMobile
    ? 'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-base font-medium text-gray-800 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400'
    : 'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400';

  const actionDescriptionClasses = isMobile ? 'text-xs text-gray-500' : 'text-xs text-gray-400';
  const iconClasses = isMobile ? 'text-lg' : '';

  const renderNativeShare = () => {
    if (!nativeShareSupported) {
      return null;
    }

    return (
      <button
        type="button"
        onClick={handleNativeShare}
        className={actionButtonClasses}
      >
        <span aria-hidden className={iconClasses}>📱</span>
        <span className="flex-1 text-left">Udostępnij przez urządzenie</span>
        <span className={actionDescriptionClasses}>Arkusz urządzenia</span>
      </button>
    );
  };

  const renderShareActions = () => (
    <>
      {renderNativeShare()}
      {SHARE_ACTIONS.map((action, index) => (
        <button
          key={action.id}
          type="button"
          ref={index === 0 ? firstActionRef : undefined}
          onClick={() => handleShareAction(action)}
          className={actionButtonClasses}
        >
          <span aria-hidden className={iconClasses}>{action.icon}</span>
          <span className="flex-1 text-left">{action.label}</span>
          <span className={actionDescriptionClasses}>{action.description}</span>
        </button>
      ))}
    </>
  );

  return (
    <div className={`relative ${className ?? ''}`} ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        className={buttonClasses}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        aria-label={buttonLabel}
        title={buttonLabel}
        onClick={handleToggle}
        disabled={disabled}
        data-testid="share-trigger"
      >
        <span aria-hidden>🔗</span>
        <span>Udostępnij</span>
      </button>

      {isOpen && isMobile && (
        <>
          <div
            className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm"
            aria-hidden
            onClick={closeMenu}
          ></div>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border border-gray-200 bg-white shadow-xl"
            data-testid="share-menu"
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <span className="text-sm font-semibold text-gray-700">Udostępnij</span>
              <button
                type="button"
                onClick={closeMenu}
                className="inline-flex items-center justify-center rounded-full p-2 text-gray-500 transition-colors hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                aria-label="Zamknij panel udostępniania"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-5 pb-6 space-y-2">
              {renderShareActions()}
            </div>
            <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 text-xs text-gray-500" role="status" aria-live="polite">
              {status?.message ?? 'Misja Antystyki: mniej clickbaitu, więcej rozmów w odcieniach szarości.'}
            </div>
          </div>
        </>
      )}

      {isOpen && !isMobile && (
        <div
          role="menu"
          className={menuClasses}
          tabIndex={-1}
          id={menuId}
          aria-label="Opcje udostępniania"
          onKeyDown={handleKeyDown}
          data-testid="share-menu"
        >
          <div className="px-4 pt-4 text-sm font-semibold text-gray-700">
            Wyślij dalej
          </div>
          <div className="mt-2 flex flex-col gap-1 px-2 pb-3">
            {renderShareActions()}
          </div>

          <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-500" role="status" aria-live="polite">
            {status?.message ?? 'Misja Antystyki: mniej clickbaitu, więcej rozmów w odcieniach szarości.'}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareMenu;


