"use client";

import { useEffect } from "react";

export default function TelegramProvider() {
  useEffect(() => {
    // Load Telegram Web App script dynamically
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    script.onload = () => {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        
        // Apply Telegram theme
        const themeParams = tg.themeParams;
        if (themeParams) {
          document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color || '#ffffff');
          document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color || '#000000');
          document.documentElement.style.setProperty('--tg-theme-hint-color', themeParams.hint_color || '#999999');
          document.documentElement.style.setProperty('--tg-theme-link-color', themeParams.link_color || '#2481cc');
          document.documentElement.style.setProperty('--tg-theme-button-color', themeParams.button_color || '#2481cc');
          document.documentElement.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color || '#ffffff');
        }
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return null;
}
