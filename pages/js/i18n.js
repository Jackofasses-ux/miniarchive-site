// Mini Archive — shared i18n helper. Include this + translations.js on
// every page, after the Supabase client is created.
//
// Shared language state and translation helpers.

let CURRENT_LANG = "en";
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
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.documentElement.lang = CURRENT_LANG;
}

async function initLanguage(supabaseClient){
  const sessionPick = sessionStorage.getItem("miniarchive_lang_session");
  const browserDefault = navigator.language && navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";

  if (sessionPick){
    CURRENT_LANG = sessionPick;
  } else if (supabaseClient){
    CURRENT_LANG = browserDefault;
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session){
        const { data: profile, error } = await supabaseClient.from("profiles").select("language").eq("id", session.user.id).maybeSingle();
        if (error) console.error("Couldn't load language preference from profile:", error);
        if (profile?.language) CURRENT_LANG = profile.language;
      }
    } catch (err){ console.error("Couldn't load language preference from profile:", err); }
  } else {
    CURRENT_LANG = browserDefault;
  }

  applyTranslations();
  updateLangToggleUI();

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
  if (typeof onLanguageChanged === "function") onLanguageChanged();
}

async function savePreferredLanguage(lang, supabaseClient){
  setLanguage(lang);
  if (supabaseClient){
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session){
        const { error } = await supabaseClient.from("profiles").update({ language: lang }).eq("id", session.user.id);
        if (error) console.error("Couldn't save language preference to profile:", error);
      }
    } catch (err){ console.error("Couldn't save language preference to profile:", err); }
  }
}

function updateLangToggleUI(){
  const current = LANGUAGES[CURRENT_LANG] || LANGUAGES.en;
  document.querySelectorAll(".lang-dropdown-label").forEach(el => { el.textContent = `${current.flag} ${current.label}`; });
  document.querySelectorAll(".lang-dropdown-menu button").forEach(btn => { btn.classList.toggle("active", btn.dataset.lang === CURRENT_LANG); });
}

document.addEventListener("click", () => {
  document.querySelectorAll(".lang-dropdown-menu.open").forEach(m => m.classList.remove("open"));
});

/*
 * Navbar alignment repair.
 * The old navbar accumulated table/table-cell rules while the rest of the
 * site uses flexbox. Override those legacy rules in one shared place so the
 * navigation, language control, login link and action button share one
 * vertical-centering context on every page.
 */
(function installNavbarLayout(){
  const css = `
    #navMenuOuter{display:flex !important;align-items:center !important;gap:40px !important;border-spacing:0 !important;list-style:none !important;}
    #navMenuOuter > li{display:flex !important;align-items:center !important;vertical-align:initial !important;}
    .nav-main-list{display:flex !important;align-items:center !important;gap:34px !important;border-spacing:0 !important;list-style:none !important;}
    .nav-main-list > li{display:flex !important;align-items:center !important;vertical-align:initial !important;}
    #authArea{display:flex !important;align-items:center !important;gap:20px !important;border-spacing:0 !important;}
    #authArea > *{display:flex !important;align-items:center !important;vertical-align:initial !important;}
    #authArea .btn-gold,#authArea .login-link{height:auto !important;min-height:20px;}
  `;
  const style = document.createElement("style");
  style.id = "miniarchive-navbar-layout-fix";
  style.textContent = css;
  document.head.appendChild(style);
})();
