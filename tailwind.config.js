/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        border: 'rgb(var(--border))',
        input: 'rgb(var(--input))',
        ring: 'rgb(var(--ring))',
        background: 'rgb(var(--background))',
        foreground: 'rgb(var(--foreground))',
        primary: {
          DEFAULT: 'rgb(var(--primary))',
          foreground: 'rgb(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary))',
          foreground: 'rgb(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive))',
          foreground: 'rgb(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted))',
          foreground: 'rgb(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent))',
          foreground: 'rgb(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'rgb(var(--popover))',
          foreground: 'rgb(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'rgb(var(--card))',
          foreground: 'rgb(var(--card-foreground))',
        },
        success: {
          DEFAULT: 'rgb(var(--success))',
          foreground: 'rgb(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'rgb(var(--warning))',
          foreground: 'rgb(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'rgb(var(--info))',
          foreground: 'rgb(var(--info-foreground))',
        },
        nav: {
          background: 'rgb(var(--nav-background))',
          foreground: 'rgb(var(--nav-foreground))',
          border: 'rgb(var(--nav-border))',
          hover: 'rgb(var(--nav-hover))',
          active: 'rgb(var(--nav-active))',
          'active-foreground': 'rgb(var(--nav-active-foreground))',
        },
        dashboard: {
          background: 'rgb(var(--dashboard-background))',
          card: 'rgb(var(--dashboard-card))',
          sidebar: 'rgb(var(--dashboard-sidebar))',
          header: 'rgb(var(--dashboard-header))',
        },
        content: {
          background: 'rgb(var(--content-background))',
          foreground: 'rgb(var(--content-foreground))',
          muted: 'rgb(var(--content-muted))',
        },
        button: {
          primary: 'rgb(var(--button-primary))',
          'primary-hover': 'rgb(var(--button-primary-hover))',
          secondary: 'rgb(var(--button-secondary))',
          'secondary-hover': 'rgb(var(--button-secondary-hover))',
        },
        form: {
          background: 'rgb(var(--form-background))',
          border: 'rgb(var(--form-border))',
          focus: 'rgb(var(--form-focus))',
          error: 'rgb(var(--form-error))',
          success: 'rgb(var(--form-success))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
}
