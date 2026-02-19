(function main() {
  const copy = {
    en: {
      status: "Status",
      status_open: "Open",
      status_ready_to_reveal: "Ready to reveal",
      status_revealed: "Revealed",
      status_none: "No active round",
      title_fallback: "Connection Task",
      task_fallback: "No task available yet."
    },
    de: {
      status: "Status",
      status_open: "Offen",
      status_ready_to_reveal: "Bereit zum Aufdecken",
      status_revealed: "Aufgedeckt",
      status_none: "Keine aktive Runde",
      title_fallback: "Verbindungsaufgabe",
      task_fallback: "Noch keine Aufgabe verfuegbar."
    },
    ru: {
      status: "Статус",
      status_open: "Открыто",
      status_ready_to_reveal: "Готово к показу",
      status_revealed: "Показано",
      status_none: "Нет активного раунда",
      title_fallback: "Задание для связи",
      task_fallback: "Пока нет активного задания."
    }
  };

  function normalizeBaseLanguage(languageCode) {
    return String(languageCode || "")
      .toLowerCase()
      .split(/[-_]/)[0];
  }

  function resolveUiLanguage(langParam, telegramLanguageCode) {
    const fromParam = normalizeBaseLanguage(langParam);
    if (copy[fromParam]) {
      return fromParam;
    }

    const fromTelegram = normalizeBaseLanguage(telegramLanguageCode);
    if (copy[fromTelegram]) {
      return fromTelegram;
    }

    return "en";
  }

  function cleanText(value) {
    if (typeof value !== "string") {
      return "";
    }
    return value.trim();
  }

  function t(lang, key) {
    return copy[lang]?.[key] || copy.en[key] || key;
  }

  function statusLabel(lang, status) {
    const key = `status_${status || "none"}`;
    return t(lang, key);
  }

  async function tryEnterFullscreen(tg) {
    try {
      if (tg?.requestFullscreen) {
        await tg.requestFullscreen();
        return true;
      }
    } catch (_error) {
      // continue with fallbacks
    }

    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        return true;
      }
    } catch (_error) {
      // browser/webview may reject this API
    }

    if (tg?.expand) {
      tg.expand();
      return true;
    }

    return false;
  }

  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
  }

  const params = new URLSearchParams(window.location.search);
  const telegramLanguage = tg?.initDataUnsafe?.user?.language_code || "";
  const uiLang = resolveUiLanguage(params.get("lang"), telegramLanguage);

  const status = cleanText(params.get("status")) || "none";
  const title = cleanText(params.get("title")) || t(uiLang, "title_fallback");
  const task = cleanText(params.get("task")) || t(uiLang, "task_fallback");

  document.documentElement.lang = uiLang;
  document.getElementById("status-pill").textContent = `${t(uiLang, "status")}: ${statusLabel(uiLang, status)}`;
  document.getElementById("task-title").textContent = title;
  document.getElementById("task-text").textContent = task;

  void tryEnterFullscreen(tg);
})();
