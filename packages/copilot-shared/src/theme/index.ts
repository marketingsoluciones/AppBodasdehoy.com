/**
 * Shared Ant Design theme for copilot-shared components
 * 
 * This theme can be used by apps/web and apps/copilot to ensure
 * consistent styling across all chat components.
 */

import type { ThemeConfig } from 'antd';

/**
 * BodasdeHoy brand colors
 */
export const brandColors = {
  primary: '#FF1493', // Deep Pink (primary brand color)
  primaryHover: '#FF69B4', // Hot Pink (hover state)
  primaryActive: '#C71585', // Medium Violet Red (active state)
  secondary: '#FFC0CB', // Pink (secondary/light)
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1890ff',
  text: {
    primary: '#262626',
    secondary: '#595959',
    disabled: '#bfbfbf',
  },
  background: {
    default: '#ffffff',
    light: '#fafafa',
    gray: '#f5f5f5',
  },
  border: {
    default: '#d9d9d9',
    light: '#e8e8e8',
  },
};

/**
 * Copilot shared theme configuration
 */
export const copilotTheme: ThemeConfig = {
  token: {
    // Brand colors
    colorPrimary: brandColors.primary,
    colorSuccess: brandColors.success,
    colorWarning: brandColors.warning,
    colorError: brandColors.error,
    colorInfo: brandColors.info,

    // Typography
    fontFamily: '"HarmonyOS Sans", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,

    // Spacing
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    
    // Shadows
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
    boxShadowSecondary: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
  },

  components: {
    // Button styles
    Button: {
      borderRadius: 8,
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
      fontWeight: 500,
    },

    // Input styles
    Input: {
      borderRadius: 8,
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
    },

    // Message/Alert styles
    Message: {
      contentBg: brandColors.background.default,
      borderRadiusLG: 12,
    },

    // Card styles
    Card: {
      borderRadiusLG: 12,
    },

    // Modal styles
    Modal: {
      borderRadiusLG: 12,
    },

    // Dropdown styles
    Dropdown: {
      borderRadiusLG: 12,
    },
  },
};

/**
 * Export theme for use in apps
 */
export default copilotTheme;
