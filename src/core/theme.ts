/**
 * MK Exotic Fruits — Official Dark Mode Color Palette
 */

export const colors = {
  // Surfaces & Backgrounds
  appBackground: '#071629',    // Midnight Navy
  sidebar: '#0B1D32',          // Deep Navy
  surface: '#10243A',          // Dark Blue (Card / Surface)
  elevatedSurface: '#172D44',  // Slate Navy (Elevated Surface)
  hoverSurface: '#1C344C',     // Deep Slate (Hover Surface)
  border: '#243B51',           // Muted Blue (Border)

  // Typography
  textPrimary: '#E6EDF2',      // Soft White
  textSecondary: '#A9B8C8',    // Cool Gray
  textMuted: '#748DA4',        // Steel Blue

  // Brand Identity
  brandPrimary: '#145B35',     // Forest Green
  brandSecondary: '#1455A0',   // Royal Blue
  brandAccent: '#C92D32',      // Crimson Red
  brandHighlight: '#75B83D',   // Fresh Green
  lightGreen: '#A4D477',       // Spring Green

  // Interactive & State
  primaryButton: '#1D7548',    // Emerald Green
  buttonHover: '#258A56',      // Bright Emerald
  success: '#26945B',          // Green
  warning: '#D99A32',          // Amber
  danger: '#D94A50',           // Soft Red
  information: '#397CC2',      // Blue
} as const;

export type ThemeColors = typeof colors;
