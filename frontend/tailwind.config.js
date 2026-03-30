/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // ── Shadcn compatibility ─────────────────────
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // ── Cyber-Neon Design Tokens ─────────────────
        cyber: {
          black:   "#080810",
          darker:  "#05050D",
          surface: "#0D0D1A",
          panel:   "#111128",
          border:  "#1A1A3E",
          muted:   "#2A2A50",
        },
        neon: {
          cyan:    "#00F5FF",
          magenta: "#FF00AA",
          violet:  "#9D00FF",
          green:   "#00FF88",
          amber:   "#FFB700",
          red:     "#FF3366",
          blue:    "#0088FF",
          "cyan-dim":    "#00C4CC",
          "magenta-dim": "#CC0088",
          "violet-dim":  "#7B00CC",
        },
      },

      fontFamily: {
        orbitron:    ["Orbitron", "monospace"],
        inter:       ["Inter", "system-ui", "sans-serif"],
        mono:        ["JetBrains Mono", "Fira Code", "monospace"],
      },

      backgroundImage: {
        "cyber-gradient":    "linear-gradient(135deg, #080810 0%, #0D0D1A 50%, #080818 100%)",
        "neon-cyan-glow":    "radial-gradient(ellipse at center, rgba(0,245,255,0.15) 0%, transparent 70%)",
        "neon-violet-glow":  "radial-gradient(ellipse at center, rgba(157,0,255,0.15) 0%, transparent 70%)",
        "neon-magenta-glow": "radial-gradient(ellipse at center, rgba(255,0,170,0.15) 0%, transparent 70%)",
        "glass-surface":     "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
        "card-gradient":     "linear-gradient(135deg, rgba(0,245,255,0.05) 0%, rgba(157,0,255,0.05) 100%)",
        "sidebar-gradient":  "linear-gradient(180deg, rgba(13,13,26,0.98) 0%, rgba(8,8,16,0.99) 100%)",
        "hero-gradient":     "linear-gradient(135deg, #080810 0%, #0D0D22 40%, #100820 100%)",
        "button-cyan":       "linear-gradient(135deg, #00C4CC 0%, #00F5FF 50%, #00D4E8 100%)",
        "button-magenta":    "linear-gradient(135deg, #CC0088 0%, #FF00AA 50%, #E8009A 100%)",
        "button-violet":     "linear-gradient(135deg, #7B00CC 0%, #9D00FF 50%, #8B00EE 100%)",
      },

      boxShadow: {
        "neon-cyan":    "0 0 20px rgba(0,245,255,0.4), 0 0 60px rgba(0,245,255,0.15)",
        "neon-magenta": "0 0 20px rgba(255,0,170,0.4), 0 0 60px rgba(255,0,170,0.15)",
        "neon-violet":  "0 0 20px rgba(157,0,255,0.4), 0 0 60px rgba(157,0,255,0.15)",
        "neon-green":   "0 0 20px rgba(0,255,136,0.4), 0 0 60px rgba(0,255,136,0.15)",
        "neon-amber":   "0 0 20px rgba(255,183,0,0.4), 0 0 60px rgba(255,183,0,0.15)",
        "glass":        "0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
        "glass-strong": "0 16px 48px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)",
        "card-hover":   "0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(0,245,255,0.08)",
        "inner-glow":   "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.3)",
      },

      keyframes: {
        "neon-pulse": {
          "0%, 100%": { opacity: "1", filter: "brightness(1)" },
          "50%":      { opacity: "0.85", filter: "brightness(1.3)" },
        },
        "neon-glow": {
          "0%, 100%": { "box-shadow": "0 0 15px rgba(0,245,255,0.3)" },
          "50%":      { "box-shadow": "0 0 35px rgba(0,245,255,0.7), 0 0 70px rgba(0,245,255,0.3)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-8px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%":      { transform: "translateY(-12px) rotate(2deg)" },
        },
        "scan": {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "ring-spin": {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
        "ring-spin-reverse": {
          from: { transform: "rotate(360deg)" },
          to:   { transform: "rotate(0deg)" },
        },
        "score-reveal": {
          "0%":   { transform: "scale(0.3) rotate(-10deg)", opacity: "0" },
          "60%":  { transform: "scale(1.1) rotate(2deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-left": {
          "0%":   { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-in-right": {
          "0%":   { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "expand-width": {
          "0%":   { width: "0%" },
          "100%": { width: "var(--target-width, 100%)" },
        },
        "count-up": {
          "0%":   { opacity: "0", transform: "scale(0.5)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "orb-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.8" },
          "50%":      { transform: "scale(1.15)", opacity: "1" },
        },
        "border-flow": {
          "0%":   { "background-position": "0% 50%" },
          "50%":  { "background-position": "100% 50%" },
          "100%": { "background-position": "0% 50%" },
        },
        "shimmer": {
          "0%":   { "background-position": "-200% 0" },
          "100%": { "background-position": "200% 0" },
        },
        "typewriter": {
          from: { width: "0" },
          to:   { width: "100%" },
        },
        "blink": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0" },
        },
      },

      animation: {
        "neon-pulse":       "neon-pulse 2s ease-in-out infinite",
        "neon-glow":        "neon-glow 2s ease-in-out infinite",
        "float":            "float 3s ease-in-out infinite",
        "float-slow":       "float-slow 5s ease-in-out infinite",
        "scan":             "scan 8s linear infinite",
        "ring-spin":        "ring-spin 3s linear infinite",
        "ring-spin-reverse":"ring-spin-reverse 2s linear infinite",
        "score-reveal":     "score-reveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "fade-up":          "fade-up 0.6s ease-out forwards",
        "fade-up-delay":    "fade-up 0.6s ease-out 0.2s both",
        "fade-in":          "fade-in 0.5s ease-out forwards",
        "slide-in-left":    "slide-in-left 0.4s ease-out forwards",
        "slide-in-right":   "slide-in-right 0.4s ease-out forwards",
        "count-up":         "count-up 0.5s ease-out forwards",
        "orb-pulse":        "orb-pulse 2.5s ease-in-out infinite",
        "border-flow":      "border-flow 3s ease infinite",
        "shimmer":          "shimmer 2s linear infinite",
        "blink":            "blink 1s step-end infinite",
      },

      backdropBlur: {
        xs: "2px",
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      spacing: {
        "sidebar":         "260px",
        "sidebar-compact": "72px",
      },

      transitionDuration: {
        "400": "400ms",
        "600": "600ms",
        "800": "800ms",
      },
    },
  },
  plugins: [],
};