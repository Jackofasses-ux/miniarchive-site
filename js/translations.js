// Mini Archive — translation dictionary.
// Add new keys here as each page gets wired up. Category values used as
// logic keys (e.g. miniatures.category = 'Paint') are NEVER translated —
// only their displayed labels are. Paint/brand names are proper nouns and
// stay as-is in both languages.

const TRANSLATIONS = {
  en: {
    // ---- Shared: header/nav ----
    nav_collection: "Collection",
    nav_how_it_works: "How it works",
    nav_provenance: "Provenance",
    nav_about: "About",
    nav_login: "Log in",
    nav_start_archive: "Start an Archive",
    nav_my_collection: "My Collection",
    nav_add_model: "Add a Model",
    nav_account_settings: "Account Settings",
    nav_logout: "Log out",

    // ---- Shared: footer ----
    footer_tagline: "Every miniature has a story.",
    footer_browse: "Browse Collection",
    footer_back_home: "← Back home",

    // ---- Shared: language toggle ----
    lang_toggle_label: "Language",

    // ---- index.html ----
    hero_eyebrow: "A Living Record of Painted Miniatures",
    hero_title_line1: "Every miniature",
    hero_title_accent: "has a story.",
    hero_lede: "Mini Archive keeps the record straight — who painted it, how long it took, every colour that went into it, and where it's been since. Not just photos. Provenance.",
    hero_cta_view_collection: "View the Collection",
    hero_cta_how_it_works: "How it works",
    featured_empty_prefix: "No public models yet — ",
    featured_empty_link: "be the first to log one →",
  },
  fr: {
    // ---- Shared: header/nav ----
    nav_collection: "Collection",
    nav_how_it_works: "Comment ça marche",
    nav_provenance: "Provenance",
    nav_about: "À propos",
    nav_login: "Connexion",
    nav_start_archive: "Créer une archive",
    nav_my_collection: "Ma collection",
    nav_add_model: "Ajouter un modèle",
    nav_account_settings: "Paramètres du compte",
    nav_logout: "Déconnexion",

    // ---- Shared: footer ----
    footer_tagline: "Chaque figurine a une histoire.",
    footer_browse: "Parcourir la collection",
    footer_back_home: "← Retour à l'accueil",

    // ---- Shared: language toggle ----
    lang_toggle_label: "Langue",

    // ---- index.html ----
    hero_eyebrow: "Une archive vivante des figurines peintes",
    hero_title_line1: "Chaque figurine",
    hero_title_accent: "a une histoire.",
    hero_lede: "Mini Archive garde les faits clairs — qui l'a peinte, combien de temps ça a pris, chaque couleur utilisée, et où elle est passée depuis. Pas juste des photos. De la provenance.",
    hero_cta_view_collection: "Voir la collection",
    hero_cta_how_it_works: "Comment ça marche",
    featured_empty_prefix: "Aucun modèle public pour l'instant — ",
    featured_empty_link: "soyez le premier à en archiver un →",
  },
};
