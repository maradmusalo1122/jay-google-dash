import type { Config } from 'tailwindcss'

/**
 * Design tokens locked to the prototype (see PLAN.md §7).
 * Palette: cream canvas, ink scale, Google 4-colour accents.
 * Type: DM Serif Display (display) + DM Sans (body).
 * Radii: 10 / 14 / 20.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Canvas + surfaces
        cream: '#FAFAF7',
        surface: '#FFFFFF',
        'surface-soft': '#F4F4F0',

        // Lines
        line: '#E8E8E2',
        'line-strong': '#D0D0C8',

        // Ink (text)
        ink: '#0F0F14',
        'ink-2': '#3D3D4E',
        'ink-3': '#8888A0',

        // Google palette
        'g-blue': '#4285F4',
        'g-red': '#EA4335',
        'g-yellow': '#FBBC05',
        'g-green': '#34A853',
        'g-blue-l': '#E8F0FE',
        'g-blue-d': '#185FA5',
      },
      borderRadius: {
        // Overrides Tailwind defaults to match prototype --r / --rlg / --rxl
        sm: '10px',
        md: '14px',
        lg: '20px',
        pill: '99px',
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        // Slightly tightened defaults for our compact UI
        xs: ['11px', '1.4'],
        sm: ['12px', '1.5'],
        base: ['13px', '1.6'],
        md: ['14px', '1.55'],
        lg: ['16px', '1.4'],
        xl: ['18px', '1.3'],
        '2xl': ['22px', '1.25'],
        '3xl': ['28px', '1.15'],
      },
      maxWidth: {
        page: '860px',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
    },
  },
  plugins: [],
} satisfies Config
