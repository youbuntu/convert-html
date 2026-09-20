import "@mantine/core/styles.css";
import "../assets/fonts/fonts.css";
import "./tailwind.css";
import type { MantineThemeOverride } from "@mantine/core";
import { createTheme, MantineProvider } from "@mantine/core";

const theme: MantineThemeOverride = createTheme({
  primaryColor: "indigo",
  defaultRadius: "md",
  fontFamily:
    '"Spoqa Han Sans Neo", "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  headings: {
    fontFamily:
      '"Spoqa Han Sans Neo", "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeight: "700",
  },
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      {children}
    </MantineProvider>
  );
}
