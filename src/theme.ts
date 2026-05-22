import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0F0E0C",
      paper: "#1A1815",
    },
    text: {
      primary: "#EDE7DC",
      secondary: "#A8A294",
    },
    primary: {
      main: "#D4A24A",
      contrastText: "#0F0E0C",
    },
    divider: "rgba(237, 231, 220, 0.08)",
  },
  typography: {
    fontFamily: "var(--font-inter), system-ui, sans-serif",
    h1: {
      fontFamily: "var(--font-fraunces), Georgia, serif",
      fontWeight: 500,
      letterSpacing: "-0.02em",
      lineHeight: 1.02,
    },
    h2: {
      fontFamily: "var(--font-fraunces), Georgia, serif",
      fontWeight: 500,
      letterSpacing: "-0.015em",
      lineHeight: 1.1,
    },
    h3: {
      fontFamily: "var(--font-fraunces), Georgia, serif",
      fontWeight: 500,
      letterSpacing: "-0.01em",
    },
    h4: {
      fontFamily: "var(--font-fraunces), Georgia, serif",
      fontWeight: 500,
    },
    h5: {
      fontFamily: "var(--font-fraunces), Georgia, serif",
      fontWeight: 500,
    },
    h6: {
      fontFamily: "var(--font-fraunces), Georgia, serif",
      fontWeight: 500,
    },
    overline: {
      fontSize: "0.7rem",
      fontWeight: 600,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      lineHeight: 1,
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          letterSpacing: "0.01em",
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
        color: "transparent",
      },
      styleOverrides: {
        root: {
          backgroundColor: "rgba(15, 14, 12, 0.78)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(237, 231, 220, 0.08)",
        },
      },
    },
  },
});
