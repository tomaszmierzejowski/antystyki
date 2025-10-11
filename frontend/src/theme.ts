/**
 * Design tokens based on the new UI mockup
 * These colors and styles match the minimal, light-gray aesthetic
 */

export const theme = {
  colors: {
    // Background colors
    background: '#f8f9fb',
    card: '#ffffff',
    
    // Text colors
    textPrimary: '#1d1d1f',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    
    // Accent colors
    accent: '#FF6A00',
    accentHover: '#E55F00',
    dark: '#1A2238',
    
    // Border colors
    borderLight: '#e5e7eb',
    borderMedium: '#d1d5db',
  },
  
  borderRadius: {
    card: '16px',
    button: '9999px',
    small: '8px',
  },
  
  shadow: {
    soft: '0 1px 6px rgba(0,0,0,0.05)',
    medium: '0 2px 12px rgba(0,0,0,0.08)',
    card: '0 1px 3px rgba(0,0,0,0.06)',
  },
  
  fontFamily: {
    sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
  },
  
  spacing: {
    containerMaxWidth: '1000px',
    sectionGap: '2rem',
  }
};

export default theme;

