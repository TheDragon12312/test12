export type Language = "nl" | "en" | "fr" | "de" | "es";

interface Translations {
  [key: string]: {
    [lang in Language]: string;
  };
}

const translations: Translations = {
  // Navigation
  "nav.dashboard": {
    nl: "Dashboard",
    en: "Dashboard",
    fr: "Tableau de bord",
    de: "Dashboard",
    es: "Panel",
  },
  "nav.focus": {
    nl: "Focus",
    en: "Focus",
    fr: "Focus",
    de: "Fokus",
    es: "Enfoque",
  },
  "nav.statistics": {
    nl: "Statistieken",
    en: "Statistics",
    fr: "Statistiques",
    de: "Statistiken",
    es: "Estadísticas",
  },
  "nav.settings": {
    nl: "Instellingen",
    en: "Settings",
    fr: "Paramètres",
    de: "Einstellungen",
    es: "Configuración",
  },
  "nav.team": {
    nl: "Team",
    en: "Team",
    fr: "Équipe",
    de: "Team",
    es: "Equipo",
  },

  // Focus Mode
  "focus.title": {
    nl: "Focus Mode",
    en: "Focus Mode",
    fr: "Mode Focus",
    de: "Fokus Modus",
    es: "Modo Enfoque",
  },
  "focus.task_placeholder": {
    nl: "Bijv. E-mails beantwoorden, Rapport schrijven, Coding...",
    en: "e.g. Answer emails, Write report, Coding...",
    fr: "ex. Répondre aux emails, Écrire un rapport, Programmation...",
    de: "z.B. E-Mails beantworten, Bericht schreiben, Programmieren...",
    es: "ej. Responder correos, Escribir informe, Programar...",
  },
  "focus.start_session": {
    nl: "Start Focus Sessie",
    en: "Start Focus Session",
    fr: "Démarrer la session",
    de: "Fokus-Sitzung starten",
    es: "Iniciar sesión",
  },
  "focus.custom_time": {
    nl: "🎯 Custom (eigen tijd)",
    en: "🎯 Custom (your time)",
    fr: "🎯 Personnalisé (votre temps)",
    de: "🎯 Benutzerdefiniert (Ihre Zeit)",
    es: "🎯 Personalizado (tu tiempo)",
  },
  "focus.minutes_label": {
    nl: "Aantal minuten (5-180):",
    en: "Number of minutes (5-180):",
    fr: "Nombre de minutes (5-180):",
    de: "Anzahl Minuten (5-180):",
    es: "Número de minutos (5-180):",
  },

  // Settings
  "settings.title": {
    nl: "Instellingen",
    en: "Settings",
    fr: "Paramètres",
    de: "Einstellungen",
    es: "Configuración",
  },
  "settings.language": {
    nl: "Taal",
    en: "Language",
    fr: "Langue",
    de: "Sprache",
    es: "Idioma",
  },
  "settings.theme": {
    nl: "Thema",
    en: "Theme",
    fr: "Thème",
    de: "Design",
    es: "Tema",
  },
  "settings.compact_mode": {
    nl: "Compacte Modus",
    en: "Compact Mode",
    fr: "Mode Compact",
    de: "Kompakt-Modus",
    es: "Modo Compacto",
  },
  "settings.compact_mode_desc": {
    nl: "Gebruik minder ruimte voor een dichtere interface",
    en: "Use less space for a denser interface",
    fr: "Utiliser moins d'espace pour une interface plus dense",
    de: "Weniger Platz für eine dichtere Oberfläche verwenden",
    es: "Usar menos espacio para una interfaz más densa",
  },

  // Theme options
  "theme.light": {
    nl: "🌞 Licht",
    en: "🌞 Light",
    fr: "🌞 Clair",
    de: "🌞 Hell",
    es: "🌞 Claro",
  },
  "theme.dark": {
    nl: "🌙 Donker",
    en: "🌙 Dark",
    fr: "🌙 Sombre",
    de: "🌙 Dunkel",
    es: "🌙 Oscuro",
  },
  "theme.auto": {
    nl: "🔄 Automatisch",
    en: "🔄 Automatic",
    fr: "🔄 Automatique",
    de: "🔄 Automatisch",
    es: "🔄 Automático",
  },

  // Language options
  "lang.nl": {
    nl: "🇳🇱 Nederlands",
    en: "🇳🇱 Dutch",
    fr: "🇳🇱 Néerlandais",
    de: "🇳🇱 Niederländisch",
    es: "🇳🇱 Holandés",
  },
  "lang.en": {
    nl: "🇺🇸 Engels",
    en: "🇺🇸 English",
    fr: "🇺🇸 Anglais",
    de: "🇺🇸 Englisch",
    es: "🇺🇸 Inglés",
  },
  "lang.fr": {
    nl: "🇫🇷 Frans",
    en: "🇫🇷 French",
    fr: "🇫🇷 Français",
    de: "🇫🇷 Französisch",
    es: "🇫🇷 Francés",
  },
  "lang.de": {
    nl: "🇩🇪 Duits",
    en: "🇩🇪 German",
    fr: "🇩🇪 Allemand",
    de: "🇩🇪 Deutsch",
    es: "🇩🇪 Alemán",
  },
  "lang.es": {
    nl: "🇪🇸 Spaans",
    en: "🇪🇸 Spanish",
    fr: "🇪🇸 Espagnol",
    de: "🇪🇸 Spanisch",
    es: "🇪🇸 Español",
  },

  // Common
  "common.save": {
    nl: "Opslaan",
    en: "Save",
    fr: "Enregistrer",
    de: "Speichern",
    es: "Guardar",
  },
  "common.cancel": {
    nl: "Annuleren",
    en: "Cancel",
    fr: "Annuler",
    de: "Abbrechen",
    es: "Cancelar",
  },
  "common.back": {
    nl: "Terug",
    en: "Back",
    fr: "Retour",
    de: "Zurück",
    es: "Volver",
  },

  // Welcome messages
  "welcome.title": {
    nl: "Welkom bij FocusFlow",
    en: "Welcome to FocusFlow",
    fr: "Bienvenue dans FocusFlow",
    de: "Willkommen bei FocusFlow",
    es: "Bienvenido a FocusFlow",
  },
  "welcome.subtitle": {
    nl: "Je productiviteitspartner voor diepere focus",
    en: "Your productivity partner for deeper focus",
    fr: "Votre partenaire de productivité pour une concentration plus profonde",
    de: "Ihr Produktivitätspartner für tiefere Konzentration",
    es: "Tu compañero de productividad para un enfoque más profundo",
  },
};

class I18nService {
  private currentLanguage: Language = "nl";

  constructor() {
    // Load saved language or detect from browser
    const saved = localStorage.getItem("focusflow_language") as Language;
    if (saved && this.isValidLanguage(saved)) {
      this.currentLanguage = saved;
    } else {
      this.currentLanguage = this.detectBrowserLanguage();
    }
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  setLanguage(lang: Language): void {
    if (this.isValidLanguage(lang)) {
      this.currentLanguage = lang;
      localStorage.setItem("focusflow_language", lang);

      // Update document language
      document.documentElement.lang = lang;

      // Trigger event for components to re-render
      window.dispatchEvent(
        new CustomEvent("languageChanged", { detail: lang }),
      );
    }
  }

  translate(key: string, fallback?: string): string {
    const translation = translations[key];

    if (translation && translation[this.currentLanguage]) {
      return translation[this.currentLanguage];
    }

    // Fallback to English if available
    if (translation && translation.en) {
      return translation.en;
    }

    // Return fallback or key if no translation found
    return fallback || key;
  }

  // Alias for shorter usage
  t(key: string, fallback?: string): string {
    return this.translate(key, fallback);
  }

  getAvailableLanguages(): Array<{ code: Language; name: string }> {
    return [
      { code: "nl", name: this.t("lang.nl") },
      { code: "en", name: this.t("lang.en") },
      { code: "fr", name: this.t("lang.fr") },
      { code: "de", name: this.t("lang.de") },
      { code: "es", name: this.t("lang.es") },
    ];
  }

  private isValidLanguage(lang: string): lang is Language {
    return ["nl", "en", "fr", "de", "es"].includes(lang);
  }

  private detectBrowserLanguage(): Language {
    const browserLang = navigator.language.split("-")[0];
    return this.isValidLanguage(browserLang) ? browserLang : "nl";
  }
}

export const i18n = new I18nService();

// React hook for easy usage in components
export const useTranslation = () => {
  const [language, setLanguageState] = React.useState(
    i18n.getCurrentLanguage(),
  );

  React.useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setLanguageState(event.detail);
    };

    window.addEventListener(
      "languageChanged",
      handleLanguageChange as EventListener,
    );

    return () => {
      window.removeEventListener(
        "languageChanged",
        handleLanguageChange as EventListener,
      );
    };
  }, []);

  const setLanguage = (lang: Language) => {
    i18n.setLanguage(lang);
  };

  return {
    language,
    setLanguage,
    t: i18n.t.bind(i18n),
    translate: i18n.translate.bind(i18n),
  };
};

// Add React import for the hook
import React from "react";
