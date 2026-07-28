// Mini Archive — shared i18n helper. Include this + translations.js on
// every page, after the Supabase client is created.
//
// Usage:
//   Static text:      <span data-i18n="hero_title_line1"></span>
//   Placeholders:      <input data-i18n-placeholder="search_placeholder">
//   Dynamic JS text:   `${t('featured_empty')}`
//
// Language source of truth, in priority order:
//   1. Logged-in user's profiles.language (if session exists)
//   2. localStorage 'miniarchive_lang'
//   3. Browser language (navigator.language starts with 'fr' → 'fr')
//   4. 'en'

let CURRENT_LANG = "en";

// Add new languages here — flag + short label. Every page's dropdown menu
// still needs its own <button data-lang="xx"> option added, but nothing
// else about the wiring changes.
const LANGUAGES = {
  en: { label: "EN", flag: "🇬🇧" },
  fr: { label: "FR", flag: "🇫🇷" },
};

function t(key){
  return (TRANSLATIONS[CURRENT_LANG] && TRANSLATIONS[CURRENT_LANG][key])
    || (TRANSLATIONS.en && TRANSLATIONS.en[key])
    || key;
}

function applyTranslations(){
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.documentElement.lang = CURRENT_LANG;
}

async function initLanguage(supabaseClient){
  const stored = localStorage.getItem("miniarchive_lang");
  const browserDefault = navigator.language && navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";
  CURRENT_LANG = stored || browserDefault;

  if (supabaseClient){
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session){
        const { data: profile, error } = await supabaseClient
          .from("profiles")
          .select("language")
          .eq("id", session.user.id)
          .maybeSingle();
        if (error) console.error("Couldn't load language preference from profile:", error);
        // Profile is the account-level source of truth once logged in — it
        // should win over whatever's cached locally, since the whole point
        // of storing it there is so it follows you across devices.
        if (profile?.language) CURRENT_LANG = profile.language;
      }
    } catch (err){
      console.error("Couldn't load language preference from profile:", err);
    }
  }

  localStorage.setItem("miniarchive_lang", CURRENT_LANG);
  applyTranslations();
  updateLangToggleUI();
}

async function setLanguage(lang, supabaseClient){
  CURRENT_LANG = lang;
  localStorage.setItem("miniarchive_lang", lang);
  applyTranslations();
  updateLangToggleUI();
  document.querySelectorAll(".lang-dropdown-menu.open").forEach(m => m.classList.remove("open"));

  if (supabaseClient){
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session){
        const { error } = await supabaseClient.from("profiles").update({ language: lang }).eq("id", session.user.id);
        if (error) console.error("Couldn't save language preference to profile — it will keep reverting on other pages until this is fixed:", error);
      }
    } catch (err){
      console.error("Couldn't save language preference to profile — it will keep reverting on other pages until this is fixed:", err);
    }
  }

  // Re-run any page-specific dynamic render functions that build text via
  // t() at runtime (e.g. rendered cards, lists) — each page defines this
  // if it has dynamic content that needs to react to a language switch.
  if (typeof onLanguageChanged === "function") onLanguageChanged();
}

function updateLangToggleUI(){
  const current = LANGUAGES[CURRENT_LANG] || LANGUAGES.en;
  document.querySelectorAll(".lang-dropdown-label").forEach(el => {
    el.textContent = `${current.flag} ${current.label}`;
  });
  document.querySelectorAll(".lang-dropdown-menu button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === CURRENT_LANG);
  });
}

// Close any open language dropdown when clicking anywhere else on the page.
document.addEventListener("click", () => {
  document.querySelectorAll(".lang-dropdown-menu.open").forEach(m => m.classList.remove("open"));
});
