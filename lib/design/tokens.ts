export const colors = {
  primary: {
    DEFAULT: "#2563EB",
    hover: "#1E40AF"
  },
  accent: {
    orange: "#F97316"
  },
  success: "#22C55E",
  neutral: {
    bg: "#F9FAFB",
    card: "#FFFFFF",
    border: "#E5E7EB",
    text: {
      primary: "#111827",
      secondary: "#6B7280"
    }
  }
} as const;

export const typography = {
  fontFamily: {
    sans: ["Inter", "sans-serif"],
    display: ["Plus Jakarta Sans", "sans-serif"]
  }
} as const;

export const ui = {
  radius: {
    sm: "6px",
    md: "10px",
    lg: "14px",
    xl: "20px"
  },
  shadow: {
    card: "0 2px 8px rgba(0,0,0,0.05)"
  }
} as const;

export const layout = {
  maxWidth: "1200px",
  paddingX: {
    sm: "16px",
    lg: "24px"
  },
  spacingY: {
    sm: "24px",
    lg: "40px"
  }
} as const;
