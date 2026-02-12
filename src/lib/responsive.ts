/**
 * Responsive Breakpoint System for Haven OS
 * 
 * Device Strategy:
 * - Desktop/Laptop (1280px+): Full experience
 * - Tablet/iPad (1024px+): Full experience with touch optimization
 * - Mobile Phone: PWA Staging Area only (separate app)
 */

export const BREAKPOINTS = {
    tablet: 1024,
    desktop: 1280,
} as const;

export type DeviceType = 'tablet' | 'desktop';

/**
 * React hook to detect current device type
 * Returns 'tablet' for iPad/tablets, 'desktop' for larger screens
 */
export function useBreakpoint(): DeviceType {
    if (typeof window === 'undefined') return 'desktop';

    const width = window.innerWidth;

    if (width >= BREAKPOINTS.desktop) return 'desktop';
    if (width >= BREAKPOINTS.tablet) return 'tablet';

    // Fallback to tablet for any screen >= 1024px
    return 'tablet';
}

/**
 * Detect if device supports touch
 */
export function isTouchDevice(): boolean {
    if (typeof window === 'undefined') return false;

    return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0
    );
}

/**
 * Get touch-friendly button classes
 */
export const TOUCH_BUTTON_CLASSES = 'min-h-[44px] touch-manipulation';
export const TOUCH_ICON_BUTTON_CLASSES = 'min-w-[44px] min-h-[44px] touch-manipulation';
