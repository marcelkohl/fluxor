import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import { ThemeProvider } from "@/config/theme";
import { applyThemeToDocument, getStoredThemeId } from "@/config/theme/theme.service";
import "@/styles/globals.css";

applyThemeToDocument(getStoredThemeId());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
