/**
 * Google Analytics 4 Integration
 * 
 * This module provides a centralized analytics tracking system for the Antystyki platform.
 * It tracks both basic traffic metrics and advanced user behavior patterns.
 * 
 * Features:
 * - Automatic pageview tracking
 * - Custom event tracking for user interactions
 * - GDPR-compliant consent management
 * - Development/production environment detection
 * - TypeScript type safety
 */

import ReactGA from 'react-ga4';

// Track whether GA4 has been initialized
let isInitialized = false;

// Track whether user has given consent
let hasConsent = false;

/**
 * Initialize Google Analytics 4
 * 
 * @param measurementId - GA4 Measurement ID (format: G-XXXXXXXXXX)
 * @param options - Optional GA4 configuration
 */
export const initializeGA4 = (measurementId?: string, options?: any) => {
  // Don't initialize if already done
  if (isInitialized) {
    console.log('[Analytics] Already initialized');
    return;
  }

  // Get measurement ID from parameter or environment variable
  const gaId = measurementId || import.meta.env.VITE_GA4_MEASUREMENT_ID;

  // Don't initialize if no measurement ID provided
  if (!gaId) {
    console.warn('[Analytics] No GA4 Measurement ID provided. Analytics disabled.');
    return;
  }

  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV;

  try {
    ReactGA.initialize(gaId, {
      testMode: isDevelopment, // Enable test mode in development
      gaOptions: {
        debug_mode: isDevelopment, // Enable debug logging in development
        anonymize_ip: true, // Anonymize IP addresses for GDPR compliance
        cookie_flags: 'SameSite=None;Secure', // Secure cookie settings
      },
      ...options,
    });

    isInitialized = true;
    console.log(`[Analytics] GA4 initialized (${isDevelopment ? 'development' : 'production'} mode)`);
  } catch (error) {
    console.error('[Analytics] Failed to initialize:', error);
  }
};

/**
 * Set user consent for analytics tracking
 * Should be called when user accepts/rejects cookie consent banner
 * 
 * @param consent - Whether user has given consent
 */
export const setAnalyticsConsent = (consent: boolean) => {
  hasConsent = consent;
  
  // Store consent in localStorage for persistence
  localStorage.setItem('analytics_consent', consent ? 'granted' : 'denied');
  
  if (consent && !isInitialized) {
    initializeGA4();
  }
  
  console.log(`[Analytics] Consent ${consent ? 'granted' : 'denied'}`);
};

/**
 * Check if user has previously given consent
 * 
 * @returns Whether user has given consent
 */
export const hasAnalyticsConsent = (): boolean => {
  const stored = localStorage.getItem('analytics_consent');
  return stored === 'granted';
};

/**
 * Track a pageview
 * Automatically called on route changes
 * 
 * @param path - Page path (e.g., '/privacy')
 * @param title - Page title (e.g., 'Privacy Policy')
 */
export const trackPageView = (path: string, title?: string) => {
  if (!isInitialized || !hasConsent) {
    return;
  }

  try {
    ReactGA.send({ 
      hitType: 'pageview', 
      page: path,
      title: title || document.title,
    });
    
    if (import.meta.env.DEV) {
      console.log('[Analytics] Pageview:', path, title);
    }
  } catch (error) {
    console.error('[Analytics] Failed to track pageview:', error);
  }
};

/**
 * Track a custom event
 * 
 * @param eventName - Name of the event
 * @param parameters - Additional event parameters
 */
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (!isInitialized || !hasConsent) {
    return;
  }

  try {
    ReactGA.event(eventName, parameters);
    
    if (import.meta.env.DEV) {
      console.log('[Analytics] Event:', eventName, parameters);
    }
  } catch (error) {
    console.error('[Analytics] Failed to track event:', error);
  }
};

type ShareEntityType = 'statistic' | 'antistic';
type SharePlatformName =
  | 'facebook'
  | 'twitter'
  | 'linkedin'
  | 'whatsapp'
  | 'messenger'
  | 'copy-link'
  | 'copy-stat'
  | 'native';

const sanitizeSharePayload = (value: string) => value.trim().slice(0, 128);

export const trackShareInitiated = (entityType: ShareEntityType, entityId: string) => {
  trackEvent('share_initiated', {
    entity_type: entityType,
    entity_id: sanitizeSharePayload(entityId),
  });
};

export const trackSharePlatform = (
  entityType: ShareEntityType,
  entityId: string,
  platform: SharePlatformName,
) => {
  trackEvent('share_platform', {
    entity_type: entityType,
    entity_id: sanitizeSharePayload(entityId),
    platform,
  });
};

export const trackShareCompleted = (
  entityType: ShareEntityType,
  entityId: string,
  platform: SharePlatformName,
) => {
  trackEvent('share_completed', {
    entity_type: entityType,
    entity_id: sanitizeSharePayload(entityId),
    platform,
  });
};

// ============================================================================
// CUSTOM EVENT TRACKING FUNCTIONS
// ============================================================================

/**
 * Track when user views an Antistic
 * 
 * @param antisticId - ID of the Antistic
 * @param title - Title of the Antistic
 * @param category - Category of the Antistic
 */
export const trackAntisticView = (antisticId: string, title?: string, category?: string) => {
  trackEvent('antistic_view', {
    antistic_id: antisticId,
    antistic_title: title,
    category: category,
  });
};

/**
 * Track when user likes an Antistic
 * 
 * @param antisticId - ID of the Antistic
 */
export const trackAntisticLike = (antisticId: string) => {
  trackEvent('antistic_like', {
    antistic_id: antisticId,
  });
};

/**
 * Track when user unlikes an Antistic
 * 
 * @param antisticId - ID of the Antistic
 */
export const trackAntisticUnlike = (antisticId: string) => {
  trackEvent('antistic_unlike', {
    antistic_id: antisticId,
  });
};

/**
 * Track when user posts a comment
 * 
 * @param antisticId - ID of the Antistic
 * @param commentLength - Length of the comment
 */
export const trackAntisticComment = (antisticId: string, commentLength?: number) => {
  trackEvent('antistic_comment', {
    antistic_id: antisticId,
    comment_length: commentLength,
  });
};

/**
 * Track when user shares an Antistic
 * 
 * @param antisticId - ID of the Antistic
 * @param method - Share method (e.g., 'copy_link', 'twitter', 'facebook')
 */
export const trackAntisticShare = (antisticId: string, method: string) => {
  trackEvent('antistic_share', {
    antistic_id: antisticId,
    share_method: method,
  });
};

/**
 * Track when user creates a new Antistic
 * 
 * @param category - Category of the created Antistic
 * @param templateUsed - Whether user used a template
 */
export const trackAntisticCreate = (category?: string, templateUsed?: boolean) => {
  trackEvent('antistic_create', {
    category: category,
    template_used: templateUsed,
  });
};

/**
 * Track when user reports an Antistic
 * 
 * @param antisticId - ID of the Antistic
 * @param reason - Report reason
 */
export const trackAntisticReport = (antisticId: string, reason: string) => {
  trackEvent('antistic_report', {
    antistic_id: antisticId,
    report_reason: reason,
  });
};

/**
 * Track search queries
 * 
 * @param query - Search query
 * @param resultsCount - Number of results returned
 */
export const trackSearch = (query: string, resultsCount?: number) => {
  trackEvent('search', {
    search_term: query,
    results_count: resultsCount,
  });
};

/**
 * Track category filtering
 * 
 * @param category - Selected category
 */
export const trackCategoryFilter = (category: string) => {
  trackEvent('category_filter', {
    category: category,
  });
};

/**
 * Track successful user registration
 * 
 * @param method - Registration method (e.g., 'email')
 */
export const trackUserRegistration = (method: string = 'email') => {
  trackEvent('sign_up', {
    method: method,
  });
};

/**
 * Track successful user login
 * 
 * @param method - Login method (e.g., 'email')
 */
export const trackUserLogin = (method: string = 'email') => {
  trackEvent('login', {
    method: method,
  });
};

/**
 * Track user logout
 */
export const trackUserLogout = () => {
  trackEvent('logout');
};

/**
 * Track email verification
 * 
 * @param success - Whether verification was successful
 */
export const trackEmailVerification = (success: boolean) => {
  trackEvent('email_verification', {
    success: success,
  });
};

/**
 * Track when user opens the create Antistic form
 */
export const trackCreateFormOpen = () => {
  trackEvent('create_form_open');
};

/**
 * Track when user starts typing in create form
 */
export const trackCreateFormStart = () => {
  trackEvent('create_form_start');
};

/**
 * Track when user selects a background/template
 * 
 * @param templateId - ID or name of the template
 */
export const trackTemplateSelect = (templateId: string) => {
  trackEvent('template_select', {
    template_id: templateId,
  });
};

/**
 * Track when user clicks "Load More" button
 * 
 * @param currentPage - Current page number
 */
export const trackLoadMore = (currentPage: number) => {
  trackEvent('load_more', {
    page: currentPage,
  });
};

/**
 * Track navigation to external links
 * 
 * @param url - External URL
 * @param linkText - Text of the link clicked
 */
export const trackExternalLink = (url: string, linkText?: string) => {
  trackEvent('external_link_click', {
    url: url,
    link_text: linkText,
  });
};

/**
 * Track monetization interactions
 * 
 * @param type - Type of monetization (e.g., 'buy_me_coffee', 'adsense')
 * @param action - Action taken (e.g., 'click', 'view')
 */
export const trackMonetization = (type: string, action: string) => {
  trackEvent('monetization_interaction', {
    monetization_type: type,
    action: action,
  });
};

/**
 * Track errors and exceptions
 * 
 * @param description - Error description
 * @param fatal - Whether the error is fatal
 */
export const trackError = (description: string, fatal: boolean = false) => {
  trackEvent('exception', {
    description: description,
    fatal: fatal,
  });
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Set user ID for tracking (when user is logged in)
 * Useful for cross-device tracking
 * 
 * @param userId - User ID from backend
 */
export const setUserId = (userId: string | null) => {
  if (!isInitialized) return;

  try {
    ReactGA.set({ userId: userId });
    
    if (import.meta.env.DEV) {
      console.log('[Analytics] User ID set:', userId);
    }
  } catch (error) {
    console.error('[Analytics] Failed to set user ID:', error);
  }
};

/**
 * Set custom user properties
 * 
 * @param properties - Custom properties to set
 */
export const setUserProperties = (properties: Record<string, any>) => {
  if (!isInitialized) return;

  try {
    ReactGA.set(properties);
    
    if (import.meta.env.DEV) {
      console.log('[Analytics] User properties set:', properties);
    }
  } catch (error) {
    console.error('[Analytics] Failed to set user properties:', error);
  }
};

/**
 * Clear all analytics data (for GDPR compliance)
 */
export const clearAnalytics = () => {
  localStorage.removeItem('analytics_consent');
  hasConsent = false;
  console.log('[Analytics] Data cleared');
};

// Export singleton status checkers
export const isAnalyticsInitialized = () => isInitialized;
export const isAnalyticsEnabled = () => isInitialized && hasConsent;

