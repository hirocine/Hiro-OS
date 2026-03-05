import type { Config } from "tailwindcss";

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
		fontFamily: {
			sans: ['"Open Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
		},
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
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
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
				'text-fade-out': 'text-fade-out 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-card': 'var(--gradient-card)'
			},
			boxShadow: {
				'elegant': 'var(--shadow-elegant)',
				'card': 'var(--shadow-card)'
			},
			gridTemplateColumns: {
				'13': 'repeat(13, minmax(0, 1fr))'
			}
		}
	},
	plugins: [require("tailwindcss-animate"), require("@tailwindcss/line-clamp"), require("@tailwindcss/typography")],
} satisfies Config;
