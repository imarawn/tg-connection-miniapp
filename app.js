(function main() {
  const copy = {
    en: {
      label_en: "English",
      label_ru: "Russian",
      empty_en: "No English task available.",
      empty_ru: "No Russian task available."
    },
    ru: {
      label_en: "Английский",
      label_ru: "Русский",
      empty_en: "Нет задания на английском.",
      empty_ru: "Нет задания на русском."
    }
  };

  function normalizeBaseLanguage(languageCode) {
    return String(languageCode || "")
      .toLowerCase()
      .split(/[-_]/)[0];
  }

  function resolveUiLanguage(langParam, telegramLanguageCode) {
    const paramBase = normalizeBaseLanguage(langParam);
    if (paramBase === "ru") {
      return "ru";
    }

    const telegramBase = normalizeBaseLanguage(telegramLanguageCode);
    if (telegramBase === "ru") {
      return "ru";
    }

    return "en";
  }

  function cleanTask(value) {
    if (typeof value !== "string") {
      return "";
    }

    return value.trim();
  }

  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
  }

  const params = new URLSearchParams(window.location.search);
  const telegramLanguage = tg?.initDataUnsafe?.user?.language_code || "";
  const uiLang = resolveUiLanguage(params.get("lang"), telegramLanguage);
  const isRussianFirst = uiLang === "ru";

  const taskEn = cleanTask(params.get("task_en") || params.get("task") || "");
  const taskRu = cleanTask(params.get("task_ru") || "");

  const primary = isRussianFirst
    ? {
        label: copy[uiLang].label_ru,
        text: taskRu || copy[uiLang].empty_ru
      }
    : {
        label: copy[uiLang].label_en,
        text: taskEn || copy[uiLang].empty_en
      };

  const secondary = isRussianFirst
    ? {
        label: copy[uiLang].label_en,
        text: taskEn || copy[uiLang].empty_en
      }
    : {
        label: copy[uiLang].label_ru,
        text: taskRu || copy[uiLang].empty_ru
      };

  document.documentElement.lang = uiLang;
  document.getElementById("task-label-primary").textContent = primary.label;
  document.getElementById("task-primary").textContent = primary.text;
  document.getElementById("task-label-secondary").textContent = secondary.label;
  document.getElementById("task-secondary").textContent = secondary.text;

})();
