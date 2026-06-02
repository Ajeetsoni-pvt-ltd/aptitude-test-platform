// src/hooks/useChartColors.ts
// Theme-aware chart color tokens — used by DashboardPage, AdminDashboard, AnalysisPage
// Eliminates hardcoded white rgba values that break in light mode

import { useThemeStore } from '@/store/themeStore';

export interface ChartColors {
  /** Axis tick label fill color */
  tickFill: string;
  /** Secondary tick fill (slightly dimmer) */
  tickFillDim: string;
  /** Grid line stroke color */
  gridStroke: string;
  /** Tooltip background style object */
  tooltipStyle: React.CSSProperties;
  /** Tooltip text color */
  tooltipTextColor: string;
  /** Tooltip label color (dimmer) */
  tooltipLabelColor: string;
  /** Dot stroke color for area charts */
  dotStroke: string;
}

/**
 * Returns theme-aware chart color tokens.
 * Usage:
 *   const colors = useChartColors();
 *   <XAxis tick={{ fill: colors.tickFill }} />
 *   <Tooltip contentStyle={colors.tooltipStyle} />
 */
export function useChartColors(): ChartColors {
  const { theme } = useThemeStore();
  const isLight = theme === 'light';

  return {
    tickFill: isLight
      ? 'rgba(52, 52, 76, 0.65)'
      : 'rgba(255, 255, 255, 0.35)',

    tickFillDim: isLight
      ? 'rgba(64, 64, 88, 0.55)'
      : 'rgba(255, 255, 255, 0.28)',

    gridStroke: isLight
      ? 'rgba(0, 0, 0, 0.07)'
      : 'rgba(255, 255, 255, 0.06)',

    tooltipStyle: isLight
      ? {
          background: 'rgba(255, 255, 255, 0.98)',
          border: '1px solid rgba(0, 0, 0, 0.10)',
          borderRadius: '12px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.10)',
        }
      : {
          background: 'rgba(8, 12, 24, 0.92)',
          border: '1px solid rgba(0, 245, 255, 0.18)',
          borderRadius: '18px',
          backdropFilter: 'blur(18px)',
        },

    tooltipTextColor: isLight
      ? 'rgba(18, 18, 36, 0.90)'
      : 'rgba(255, 255, 255, 0.90)',

    tooltipLabelColor: isLight
      ? 'rgba(52, 52, 76, 0.60)'
      : 'rgba(255, 255, 255, 0.35)',

    dotStroke: isLight ? '#F4F6FA' : '#080810',
  };
}
