(function main() {
  const copy = {
    en: {
      status: "Status",
      status_open: "Open",
      status_ready_to_reveal: "Ready to reveal",
      status_revealed: "Revealed",
      status_none: "No active round",
      status_loading: "Loading",
      status_error: "Unavailable",
      title_fallback: "Connection Task",
      title_loading: "Loading task...",
      title_error: "Could not load task",
      label_en: "English",
      label_ru: "Russian",
      task_fallback_en: "No English task available.",
      task_fallback_ru: "No Russian task available.",
      task_loading: "Please wait a moment...",
      task_error: "Please open the bot chat and try again."
    },
    de: {
      status: "Status",
      status_open: "Offen",
      status_ready_to_reveal: "Bereit zum Aufdecken",
      status_revealed: "Aufgedeckt",
      status_none: "Keine aktive Runde",
      status_loading: "Laedt",
      status_error: "Nicht verfuegbar",
      title_fallback: "Verbindungsaufgabe",
      title_loading: "Aufgabe wird geladen...",
      title_error: "Aufgabe konnte nicht geladen werden",
      label_en: "Englisch",
      label_ru: "Russisch",
      task_fallback_en: "Keine englische Aufgabe verfuegbar.",
      task_fallback_ru: "Keine russische Aufgabe verfuegbar.",
      task_loading: "Bitte kurz warten...",
      task_error: "Bitte im Bot-Chat erneut oeffnen."
    },
    ru: {
      status: "Статус",
      status_open: "Открыто",
      status_ready_to_reveal: "Готово к показу",
      status_revealed: "Показано",
      status_none: "Нет активного раунда",
      status_loading: "Загрузка",
      status_error: "Недоступно",
      title_fallback: "Задание для связи",
      title_loading: "Загрузка задания...",
      title_error: "Не удалось загрузить задание",
      label_en: "Английский",
      label_ru: "Русский",
      task_fallback_en: "Нет задания на английском.",
      task_fallback_ru: "Нет задания на русском.",
      task_loading: "Пожалуйста, подождите...",
      task_error: "Откройте чат бота и попробуйте снова."
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

  function getApiUrl(params) {
    const fromParam = cleanText(params.get("api"));
    if (fromParam) {
      return fromParam;
    }

    const fromConfig = cleanText(window.APP_CONFIG?.apiUrl);
    if (fromConfig) {
      return fromConfig;
    }

    return "";
  }

  function render(uiLang, data) {
    const status = cleanText(data?.status) || "none";
    const titleEn = cleanText(data?.title_en);
    const titleRu = cleanText(data?.title_ru);
    const taskEn = cleanText(data?.task_en);
    const taskRu = cleanText(data?.task_ru);

    const resolvedTitle = uiLang === "ru"
      ? (titleRu || titleEn || t(uiLang, "title_fallback"))
      : (titleEn || titleRu || t(uiLang, "title_fallback"));

    document.documentElement.lang = uiLang;
    document.getElementById("status-pill").textContent = `${t(uiLang, "status")}: ${statusLabel(uiLang, status)}`;
    document.getElementById("task-title").textContent = resolvedTitle;
    document.getElementById("task-label-en").textContent = t(uiLang, "label_en");
    document.getElementById("task-label-ru").textContent = t(uiLang, "label_ru");
    document.getElementById("task-text-en").textContent = taskEn || t(uiLang, "task_fallback_en");
    document.getElementById("task-text-ru").textContent = taskRu || t(uiLang, "task_fallback_ru");
  }

  function renderLoading(uiLang) {
    render(uiLang, {
      status: "loading",
      title_en: t(uiLang, "title_loading"),
      title_ru: t(uiLang, "title_loading"),
      task_en: t(uiLang, "task_loading"),
      task_ru: t(uiLang, "task_loading")
    });
  }

  function renderError(uiLang) {
    render(uiLang, {
      status: "error",
      title_en: t(uiLang, "title_error"),
      title_ru: t(uiLang, "title_error"),
      task_en: t(uiLang, "task_error"),
      task_ru: t(uiLang, "task_error")
    });
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

  async function fetchTaskFromApi(apiUrl, initData) {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ initData })
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch (_error) {
      payload = null;
    }

    if (!response.ok) {
      const reason = cleanText(payload?.error) || `HTTP ${response.status}`;
      throw new Error(reason);
    }

    return payload || {};
  }

  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
  }

  const params = new URLSearchParams(window.location.search);
  const telegramLanguage = tg?.initDataUnsafe?.user?.language_code || "";
  const uiLang = resolveUiLanguage(params.get("lang"), telegramLanguage);
  const apiUrl = getApiUrl(params);
  const initData = cleanText(tg?.initData || "");

  renderLoading(uiLang);
  void tryEnterFullscreen(tg);

  if (!apiUrl || !initData) {
    renderError(uiLang);
    return;
  }

  void (async () => {
    try {
      const payload = await fetchTaskFromApi(apiUrl, initData);
      render(uiLang, payload);
    } catch (error) {
      console.error("[miniapp] task-fetch-error", error?.message || error);
      renderError(uiLang);
    }
  })();
})();
