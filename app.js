(function main() {
  const translations = {
    en: {
      status: "Status",
      status_open: "Open",
      status_ready_to_reveal: "Ready to reveal",
      status_revealed: "Revealed",
      status_none: "No active round",
      title_fallback: "Connection Task",
      subtitle_no_task: "No task is attached yet.",
      task_heading: "Task",
      task_empty: "No task text available.",
      pair_label: "Pair",
      round_label: "Round",
      fullscreen: "Open fullscreen"
    },
    de: {
      status: "Status",
      status_open: "Offen",
      status_ready_to_reveal: "Bereit zum Aufdecken",
      status_revealed: "Aufgedeckt",
      status_none: "Keine aktive Runde",
      title_fallback: "Verbindungsaufgabe",
      subtitle_no_task: "Aktuell ist noch keine Aufgabe hinterlegt.",
      task_heading: "Aufgabe",
      task_empty: "Kein Aufgabentext verfügbar.",
      pair_label: "Paar",
      round_label: "Runde",
      fullscreen: "Vollbild öffnen"
    },
    ru: {
      status: "Статус",
      status_open: "Открыто",
      status_ready_to_reveal: "Готово к показу",
      status_revealed: "Показано",
      status_none: "Нет активного раунда",
      title_fallback: "Задание для связи",
      subtitle_no_task: "Пока нет активного задания.",
      task_heading: "Задание",
      task_empty: "Текст задания отсутствует.",
      pair_label: "Пара",
      round_label: "Раунд",
      fullscreen: "Открыть на весь экран"
    }
  };

  function getPreferredLanguage(params, telegramLanguageCode) {
    const fromParam = (params.get("lang") || "").toLowerCase().split(/[-_]/)[0];
    const fromTelegram = String(telegramLanguageCode || "")
      .toLowerCase()
      .split(/[-_]/)[0];

    if (translations[fromParam]) {
      return fromParam;
    }

    if (translations[fromTelegram]) {
      return fromTelegram;
    }

    return "en";
  }

  function t(lang, key) {
    return translations[lang]?.[key] || translations.en[key] || key;
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
      // fallback below
    }

    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        return true;
      }
    } catch (_error) {
      // ignored; some webviews reject this API
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
    tg.expand();
  }

  const params = new URLSearchParams(window.location.search);
  const telegramLanguage = tg?.initDataUnsafe?.user?.language_code || "";
  const lang = getPreferredLanguage(params, telegramLanguage);

  const status = params.get("status") || "none";
  const title = params.get("title") || t(lang, "title_fallback");
  const task = params.get("task") || "";
  const roundId = params.get("round_id") || "-";
  const pairingId = params.get("pairing_id") || "-";
  const ownerName = params.get("owner_name") || "-";
  const inviteeName = params.get("invitee_name") || "-";

  const pairDisplay =
    ownerName !== "-" || inviteeName !== "-"
      ? `${ownerName} ↔ ${inviteeName}`
      : `#${pairingId}`;

  document.documentElement.lang = lang;
  document.getElementById("status-pill").textContent = `${t(lang, "status")}: ${statusLabel(lang, status)}`;
  document.getElementById("title").textContent = title;
  document.getElementById("subtitle").textContent = task ? "" : t(lang, "subtitle_no_task");
  document.getElementById("task-heading").textContent = t(lang, "task_heading");
  document.getElementById("task-text").textContent = task || t(lang, "task_empty");

  document.getElementById("pair-label").textContent = t(lang, "pair_label");
  document.getElementById("pair-value").textContent = pairDisplay;
  document.getElementById("round-label").textContent = t(lang, "round_label");
  document.getElementById("round-value").textContent = roundId;

  const fullscreenButton = document.getElementById("fullscreen-btn");
  if (fullscreenButton) {
    fullscreenButton.textContent = t(lang, "fullscreen");
    fullscreenButton.addEventListener("click", async () => {
      fullscreenButton.disabled = true;
      await tryEnterFullscreen(tg);
      window.setTimeout(() => {
        fullscreenButton.disabled = false;
      }, 600);
    });
  }

  // Try to maximize at launch in Telegram clients that support it.
  void tryEnterFullscreen(tg);
})();
