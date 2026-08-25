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

  if (sessionPick){ CURRENT_LANG = sessionPick; }
  else if (supabaseClient){
    CURRENT_LANG = browserDefault;
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session){
        const { data: profile, error } = await supabaseClient.from("profiles").select("language").eq("id", session.user.id).maybeSingle();
        if (error) console.error("Couldn't load language preference from profile:", error);
        if (profile?.language) CURRENT_LANG = profile.language;
      }
    } catch (err){ console.error("Couldn't load language preference from profile:", err); }
  } else CURRENT_LANG = browserDefault;

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

/* Shared navbar alignment and typography repair. */
(function installNavbarLayout(){
  const css = `
    #navMenuOuter,.nav-main-list,#authArea{display:flex !important;align-items:center !important;border-spacing:0 !important;}
    #navMenuOuter{gap:40px !important;list-style:none !important;}
    .nav-main-list{gap:34px !important;list-style:none !important;}
    #authArea{gap:20px !important;position:relative;}
    #navMenuOuter > li,.nav-main-list > li,#authArea > *{display:flex !important;align-items:center !important;height:42px !important;vertical-align:initial !important;}
    .nav-main-list li a,.nav-more-btn,.lang-dropdown-btn{height:42px !important;padding-top:0 !important;padding-bottom:0 !important;display:flex !important;align-items:center !important;line-height:1 !important;}
    .nav-main-list li a::after{bottom:6px !important;}
    #authArea .login-link{height:42px !important;min-height:42px !important;display:flex !important;align-items:center !important;line-height:1 !important;}
    #authArea .btn-gold{height:42px !important;min-height:42px !important;display:flex !important;align-items:center !important;justify-content:center !important;line-height:1 !important;}

    /* Desktop: the avatar is the single account entry point. */
    @media (min-width:801px){#userMenuBtn{display:none !important;}#userToggle{display:flex !important;}}

    /* One typography system across navbar controls and dropdown menus. */
    .nav-main-list li a,.nav-more-btn,.lang-dropdown-btn,#authArea .login-link,#authArea .btn-gold,.user-menu-btn,.dropdown a,.dropdown button,.lang-dropdown-menu button{
      font-family:'IBM Plex Mono',monospace !important;
      font-size:0.68rem !important;
      font-weight:500 !important;
      letter-spacing:0.12em !important;
      text-transform:uppercase !important;
    }
    .dropdown a,.dropdown button,.lang-dropdown-menu button{line-height:1.4 !important;}
  `;
  const style = document.createElement("style");
  style.id = "miniarchive-navbar-layout-fix";
  style.textContent = css;
  document.head.appendChild(style);
})();
