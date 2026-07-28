// Mini Archive — shared i18n helper. Include this + translations.js on
// every page, after the Supabase client is created.
//
// Usage:
//   Static text:      <span data-i18n="hero_title_line1"></span>
//   Placeholders:      <input data-i18n-placeholder="search_placeholder">
//   Dynamic JS text:   `${t('featured_empty')}`
//
// Language source of truth, in priority order:
//   1. sessionStorage 'miniarchive_lang_session' — a casual pick made via
//      the header dropdown THIS TAB, THIS SESSION ONLY. Clears itself when
//      the tab closes, and is explicitly cleared on logout too, so logging
//      out and back in always reverts to your actual saved default rather
//      than whatever you were casually viewing before.
//   2. Logged-in user's profiles.language (your actual saved preference).
//   3. Browser language (navigator.language starts with 'fr' → 'fr').
//   4. 'en'.
//
// Deliberately two separate functions below:
//   setLanguage()          — quick, session-only switch (header dropdown).
//                            Never touches the saved profile preference.
//   savePreferredLanguage() — the ONLY path that writes to the profile.
//                            Called exclusively from the Account →
//                            Preferences "Save Preferences" button, so a
//                            casual header toggle can never silently
//                            overwrite something you deliberately saved.

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
  const sessionPick = sessionStorage.getItem("miniarchive_lang_session");
  const browserDefault = navigator.language && navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";

  if (sessionPick){
    CURRENT_LANG = sessionPick;
  } else if (supabaseClient){
    // No casual pick yet this session — use the saved profile preference
    // if logged in, otherwise fall back to browser language.
    CURRENT_LANG = browserDefault;
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session){
        const { data: profile, error } = await supabaseClient
          .from("profiles")
          .select("language")
          .eq("id", session.user.id)
          .maybeSingle();
        if (error) console.error("Couldn't load language preference from profile:", error);
        if (profile?.language) CURRENT_LANG = profile.language;
      }
    } catch (err){
      console.error("Couldn't load language preference from profile:", err);
    }
  } else {
    CURRENT_LANG = browserDefault;
  }

  applyTranslations();
  updateLangToggleUI();

  // Clear the session-only pick the moment you log out, so logging back in
  // (even in the same tab) starts fresh from the saved/default language
  // rather than carrying over whatever you were casually viewing.
  if (supabaseClient && !initLanguage._authListenerAttached){
    initLanguage._authListenerAttached = true;
    supabaseClient.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") sessionStorage.removeItem("miniarchive_lang_session");
    });
  }
}

function setLanguage(lang){
  CURRENT_LANG = lang;
  sessionStorage.setItem("miniarchive_lang_session", lang);
  applyTranslations();
  updateLangToggleUI();
  document.querySelectorAll(".lang-dropdown-menu.open").forEach(m => m.classList.remove("open"));

  // Re-run any page-specific dynamic render functions that build text via
  // t() at runtime (e.g. rendered cards, lists) — each page defines this
  // if it has dynamic content that needs to react to a language switch.
  if (typeof onLanguageChanged === "function") onLanguageChanged();
}

async function savePreferredLanguage(lang, supabaseClient){
  setLanguage(lang); // apply immediately, same as any other switch

  if (supabaseClient){
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session){
        const { error } = await supabaseClient.from("profiles").update({ language: lang }).eq("id", session.user.id);
        if (error) console.error("Couldn't save language preference to profile:", error);
      }
    } catch (err){
      console.error("Couldn't save language preference to profile:", err);
    }
  }
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
