import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
// @tailwindcss/line-clamp is built into Tailwind v3.3+ and no longer needs
// to be loaded as a plugin (still installed as a dependency for compat with
// any code that might import from it directly).
import typography from "@tailwindcss/typography";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				'step-pending': {
					DEFAULT: 'hsl(var(--step-pending))',
					foreground: 'hsl(var(--step-pending-foreground))'
				},
				'step-separated': {
					DEFAULT: 'hsl(var(--step-separated))',
					foreground: 'hsl(var(--step-separated-foreground))'
				},
				'step-pickup': {
					DEFAULT: 'hsl(var(--step-pickup))',
					foreground: 'hsl(var(--step-pickup-foreground))'
				},
				'step-in-use': {
					DEFAULT: 'hsl(var(--step-in-use))',
					foreground: 'hsl(var(--step-in-use-foreground))'
				},
				'step-verification': {
					DEFAULT: 'hsl(var(--step-verification))',
					foreground: 'hsl(var(--step-verification-foreground))'
				},
				'step-office-receipt': {
					DEFAULT: 'hsl(var(--step-office-receipt))',
					foreground: 'hsl(var(--step-office-receipt-foreground))'
				},
				'step-verified': {
					DEFAULT: 'hsl(var(--step-verified))',
					foreground: 'hsl(var(--step-verified-foreground))'
				},
				'status-active': {
					DEFAULT: 'hsl(var(--status-active))',
					foreground: 'hsl(var(--status-active-foreground))'
				},
				'status-completed': {
					DEFAULT: 'hsl(var(--status-completed))',
					foreground: 'hsl(var(--status-completed-foreground))'
				},
				'status-archived': {
					DEFAULT: 'hsl(var(--status-archived))',
					foreground: 'hsl(var(--status-archived-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				hf: {
					black: "#000000",
					"gray-1": "#141414",
					"gray-2": "#282828",
					"gray-3": "#3A3A3A",
					"gray-4": "#4C4C4C",
					"gray-5": "#AAAAAA",
					"gray-6": "#BCBCBC",
					"gray-7": "#D3D3D3",
					"gray-8": "#EAEAEA",
					white: "#FFFFFF",
					green: "#4CFF5C",
					"green-1": "#46E84D",
					"green-2": "#40D340",
					"green-3": "#37BC37",
					"green-4": "#24A024",
					"green-soft": "#D6FFD9",
					"green-ink": "#0A2E0A",
				},
				os: {
					bg: "#FAFAFA",
					surface: "#FFFFFF",
					"surface-2": "#F5F5F5",
					"surface-3": "#EAEAEA",
					line: "#EAEAEA",
					"line-2": "#D3D3D3",
					"line-3": "#BCBCBC",
					"fg-1": "#000000",
					"fg-2": "#3A3A3A",
					"fg-3": "#4C4C4C",
					"fg-4": "#AAAAAA",
					accent: "#37BC37",
					"accent-soft": "#D6FFD9",
					"accent-ink": "#0A2E0A",
					"accent-bright": "#4CFF5C",
					warn: "#B8860B",
					"warn-soft": "#FAF0D7",
					danger: "#C13030",
					"danger-soft": "#FBE7E7",
					info: "#1F6FB8",
					"info-soft": "#E1EDF8",
				},
				// === HIRO DS (Phase 1, additive) — namespaced under `ds` ===
				ds: {
					background: 'hsl(var(--ds-background))',
					foreground: 'hsl(var(--ds-foreground))',
					primary: {
						DEFAULT: 'hsl(var(--ds-primary))',
						foreground: 'hsl(var(--ds-primary-foreground))',
					},
					secondary: {
						DEFAULT: 'hsl(var(--ds-secondary))',
						foreground: 'hsl(var(--ds-secondary-foreground))',
					},
					muted: {
						DEFAULT: 'hsl(var(--ds-muted))',
						foreground: 'hsl(var(--ds-muted-foreground))',
					},
					accent: {
						DEFAULT: 'hsl(var(--ds-accent))',
						foreground: 'hsl(var(--ds-accent-foreground))',
						bright: 'hsl(var(--ds-accent-bright))',
						soft: 'hsl(var(--ds-accent-soft))',
						deep: 'hsl(var(--ds-accent-deep))',
					},
					destructive: {
						DEFAULT: 'hsl(var(--ds-destructive))',
						foreground: 'hsl(var(--ds-destructive-foreground))',
					},
					border: 'hsl(var(--ds-border))',
					input: 'hsl(var(--ds-input))',
					ring: 'hsl(var(--ds-ring))',
					card: {
						DEFAULT: 'hsl(var(--ds-card))',
						foreground: 'hsl(var(--ds-card-foreground))',
					},
					popover: {
						DEFAULT: 'hsl(var(--ds-popover))',
						foreground: 'hsl(var(--ds-popover-foreground))',
					},
					surface: {
						DEFAULT: 'hsl(var(--ds-surface))',
						2: 'hsl(var(--ds-surface-2))',
						3: 'hsl(var(--ds-surface-3))',
					},
					fg: {
						1: 'hsl(var(--ds-fg-1))',
						2: 'hsl(var(--ds-fg-2))',
						3: 'hsl(var(--ds-fg-3))',
						4: 'hsl(var(--ds-fg-4))',
					},
					line: {
						1: 'hsl(var(--ds-line-1))',
						2: 'hsl(var(--ds-line-2))',
						3: 'hsl(var(--ds-line-3))',
					},
					warn:    'hsl(var(--ds-warn))',
					info:    'hsl(var(--ds-info))',
					success: 'hsl(var(--ds-success))',
				},
			},
			fontFamily: {
				// Phase 1: new keys, do not override default `sans`
				display: ['"HN Display"', '"Helvetica Now Display"', 'Helvetica', 'Arial', 'system-ui', 'sans-serif'],
				hn:      ['"HN Text"', '"Helvetica Now Text"', 'Helvetica', 'Arial', 'system-ui', 'sans-serif'],
			},
			spacing: {
				'page-x':   'clamp(20px, 4vw, 64px)',
				'rhythm-1': '24px',
				'rhythm-2': '40px',
				'rhythm-3': '64px',
				'rhythm-4': '120px',
				rail:       '64px',
				side:       '256px',
				topbar:     '56px',
			},
			borderRadius: {
				pill: '999px',
			},
			transitionDuration: {
				fast: '120ms',
				slow: '320ms',
				page: '400ms',
			},
			transitionTimingFunction: {
				'ds-out': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
				'ds-in':  'cubic-bezier(0.4, 0, 1, 1)',
			},
			keyframes: {
				shimmer: {
					'0%': {
						transform: 'translateX(-100%)'
					},
					'100%': {
						transform: 'translateX(100%)'
					}
				},
			'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'collapsible-down': {
					from: {
						height: '0',
						opacity: '0'
					},
					to: {
						height: 'var(--radix-collapsible-content-height)',
						opacity: '1'
					}
				},
				'collapsible-up': {
					from: {
						height: 'var(--radix-collapsible-content-height)',
						opacity: '1'
					},
					to: {
						height: '0',
						opacity: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slide-up': {
					'0%': {
						opacity: '0',
						transform: 'translateY(20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'sidebar-expand': {
					'0%': {
						transform: 'scaleX(0.95)',
						opacity: '0.8'
					},
					'100%': {
						transform: 'scaleX(1)',
						opacity: '1'
					}
				},
				'sidebar-collapse': {
					'0%': {
						transform: 'scaleX(1)',
						opacity: '1'
					},
					'100%': {
						transform: 'scaleX(0.95)',
						opacity: '0.9'
					}
				},
				'text-fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateX(-10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateX(0)'
					}
				},
				'text-fade-out': {
					'0%': {
						opacity: '1',
						transform: 'translateX(0)'
					},
					'100%': {
						opacity: '0',
						transform: 'translateX(-10px)'
					}
				},
				// === HIRO DS animations ===
				'mask-up': {
					from: { transform: 'translateY(8px)', clipPath: 'inset(100% 0 0 0)' },
					to:   { transform: 'translateY(0)',   clipPath: 'inset(0 0 0 0)'  },
				},
				'fade-up': {
					from: { opacity: '0', transform: 'translateY(8px)' },
					to:   { opacity: '1', transform: 'translateY(0)' },
				}
			},
			animation: {
				shimmer: 'shimmer 2s infinite',
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'collapsible-down': 'collapsible-down 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
				'collapsible-up': 'collapsible-up 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
				'fade-in': 'fade-in 0.3s ease-out',
				'slide-up': 'slide-up 0.4s ease-out',
				'sidebar-expand': 'sidebar-expand 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
				'sidebar-collapse': 'sidebar-collapse 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
				'text-fade-in': 'text-fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
				'text-fade-out': 'text-fade-out 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
				'mask-up': 'mask-up 320ms cubic-bezier(0.2, 0.8, 0.2, 1)',
				'fade-up': 'fade-up 200ms cubic-bezier(0.2, 0.8, 0.2, 1)'
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-card': 'var(--gradient-card)'
			},
			boxShadow: {
				'elegant': 'var(--shadow-elegant)',
				'card': 'var(--shadow-card)',
				// === HIRO DS hairlines & focus ring ===
				'ds-hairline':   '0 1px 0 hsl(var(--ds-line-1))',
				'ds-hairline-b': 'inset 0 -1px 0 hsl(var(--ds-line-1))',
				'ds-focus-ring': '0 0 0 2px hsl(var(--ds-background)), 0 0 0 4px hsl(var(--ds-ring))'
			},
			gridTemplateColumns: {
				'13': 'repeat(13, minmax(0, 1fr))'
			}
		}
	},
	plugins: [tailwindcssAnimate, typography],
} satisfies Config;
