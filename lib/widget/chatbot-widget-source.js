/* eslint-disable @typescript-eslint/no-this-alias, @typescript-eslint/no-unused-vars */
/**
 * MBR Studio embeddable chat widget.
 */
(function () {
  "use strict";

  var LEAD_CAPTURE_MARKER = "\n\n[[MBR_LEAD_CAPTURE]]";

  var scriptEl =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();

  var CLIENT_KEY = scriptEl.getAttribute("data-client");
  if (!CLIENT_KEY) {
    console.error(
      "[MBR Chat Widget] Missing data-client attribute — widget not mounted.",
    );
    return;
  }

  var API_BASE = (function () {
    try {
      return new URL(scriptEl.src).origin;
    } catch (e) {
      return "";
    }
  })();

  var STORAGE_VISITOR_KEY = "mbr-widget-visitor-id";
  var STORAGE_CONFIG_PREFIX = "mbr-widget-config:";

  function getVisitorId() {
    try {
      var existing = window.localStorage.getItem(STORAGE_VISITOR_KEY);
      if (existing) return existing;
      var id =
        "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      window.localStorage.setItem(STORAGE_VISITOR_KEY, id);
      return id;
    } catch (e) {
      return (
        "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36)
      );
    }
  }

  function prefersReducedMotion() {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {
      return false;
    }
  }

  async function fetchConfig() {
    var cacheKey = STORAGE_CONFIG_PREFIX + CLIENT_KEY;
    try {
      var cached = window.sessionStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      /* ignore */
    }

    var res = await fetch(
      API_BASE + "/api/widget/config?client=" + encodeURIComponent(CLIENT_KEY),
    );
    if (!res.ok) throw new Error("config fetch failed: " + res.status);
    var data = await res.json();

    try {
      window.sessionStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (e) {
      /* ignore */
    }
    return data;
  }

  var FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

  function trapFocus(container, onEscape) {
    var previouslyFocused = document.activeElement;

    function focusables() {
      return Array.prototype.slice.call(
        container.querySelectorAll(FOCUSABLE_SELECTOR),
      );
    }

    var first = focusables()[0];
    if (first) first.focus();

    function handleKeydown(e) {
      if (e.key === "Escape") {
        onEscape();
        return;
      }
      if (e.key !== "Tab") return;
      var items = focusables();
      if (items.length === 0) return;
      var firstEl = items[0];
      var lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }

    container.addEventListener("keydown", handleKeydown);
    return function release() {
      container.removeEventListener("keydown", handleKeydown);
      if (previouslyFocused && previouslyFocused.focus)
        previouslyFocused.focus();
    };
  }

  var WIDGET_CSS = [
    ":host { all: initial; }",
    "* { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif; }",
    ".mbr-launcher { position: fixed; bottom: 20px; z-index: 999999; width: 56px; height: 56px; border-radius: 50%; background: var(--mbr-primary, #6366f1); color: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(0,0,0,0.2); transition: transform 0.2s ease; }",
    ".mbr-launcher.mbr-pos-right { right: 20px; }",
    ".mbr-launcher.mbr-pos-left { left: 20px; }",
    ".mbr-launcher:hover { transform: scale(1.06); }",
    ".mbr-launcher svg { width: 26px; height: 26px; }",
    ".mbr-panel { position: fixed; bottom: 88px; z-index: 999999; width: 360px; max-width: calc(100vw - 32px); height: 560px; max-height: calc(100vh - 120px); background: #fff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.25); display: flex; flex-direction: column; overflow: hidden; opacity: 0; transform: translateY(12px) scale(0.98); pointer-events: none; transition: opacity 0.18s ease, transform 0.18s ease; }",
    ".mbr-panel.mbr-pos-right { right: 20px; }",
    ".mbr-panel.mbr-pos-left { left: 20px; }",
    ".mbr-panel.mbr-open { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }",
    ".mbr-reduced-motion .mbr-panel, .mbr-reduced-motion .mbr-launcher { transition: none !important; }",
    "@media (max-width: 480px) { .mbr-panel { position: fixed; inset: 0; width: 100%; height: 100%; max-width: 100%; max-height: 100%; border-radius: 0; bottom: 0; right: 0; left: 0; } }",
    ".mbr-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: var(--mbr-primary, #6366f1); color: #fff; flex: 0 0 auto; }",
    ".mbr-header-title { font-size: 14px; font-weight: 600; }",
    ".mbr-header-sub { font-size: 11px; opacity: 0.85; }",
    ".mbr-close-btn { background: transparent; border: none; color: #fff; cursor: pointer; padding: 4px; opacity: 0.9; }",
    ".mbr-close-btn:hover { opacity: 1; }",
    ".mbr-header-actions { display: flex; align-items: center; gap: 2px; flex: 0 0 auto; }",
    ".mbr-confirm-bar { display: none; align-items: center; justify-content: space-between; gap: 10px; padding: 9px 13px; background: #fffaf0; border-bottom: 1px solid #f3e3b8; font-size: 11.5px; line-height: 1.4; color: #7a5c14; flex: 0 0 auto; }",
    ".mbr-confirm-bar.mbr-show { display: flex; }",
    ".mbr-confirm-actions { display: flex; gap: 6px; flex: 0 0 auto; }",
    ".mbr-confirm-cancel, .mbr-confirm-ok { border: none; border-radius: 6px; padding: 5px 9px; font-size: 11px; font-weight: 600; cursor: pointer; }",
    ".mbr-confirm-cancel { background: transparent; color: #7a5c14; }",
    ".mbr-confirm-cancel:hover { background: rgba(122, 92, 20, 0.1); }",
    ".mbr-confirm-ok { background: #7a5c14; color: #fff; }",
    ".mbr-confirm-ok:hover { opacity: 0.9; }",
    ".mbr-messages { flex: 1 1 auto; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; }",
    ".mbr-bubble { max-width: 82%; padding: 9px 13px; border-radius: 14px; font-size: 13.5px; line-height: 1.5; white-space: pre-wrap; }",
    ".mbr-bubble-assistant { align-self: flex-start; background: #f1f2f6; color: #14141c; border-bottom-left-radius: 4px; }",
    ".mbr-bubble-user { align-self: flex-end; background: var(--mbr-primary, #6366f1); color: #fff; border-bottom-right-radius: 4px; }",
    ".mbr-bubble-human { align-self: flex-start; background: #e6f7f0; color: #0a5c3d; border-bottom-left-radius: 4px; border: 1px solid #b8ead8; }",
    ".mbr-system-note { align-self: center; font-size: 11.5px; color: #9aa0ac; text-align: center; padding: 4px 10px; }",
    ".mbr-typing { align-self: flex-start; display: flex; align-items: center; padding: 10px 13px; background: #f1f2f6; border-radius: 14px; }",
    ".mbr-typing span { width: 9px; height: 9px; border-radius: 50%; background: linear-gradient(135deg, var(--mbr-primary, #6366f1), var(--mbr-accent, #06b6d4)); animation: mbr-breathe 1.6s ease-in-out infinite; }",
    "@keyframes mbr-breathe { 0%, 100% { transform: scale(0.85); opacity: 0.55; } 50% { transform: scale(1); opacity: 1; } }",
    ".mbr-reduced-motion .mbr-typing span { animation: none; opacity: 0.85; }",
    ".mbr-input-row { display: flex; gap: 8px; padding: 10px 12px; border-top: 1px solid #eceef2; flex: 0 0 auto; }",
    ".mbr-input { flex: 1 1 auto; border: 1px solid #dfe1e8; border-radius: 10px; padding: 9px 12px; font-size: 13.5px; outline: none; }",
    ".mbr-input:focus { border-color: var(--mbr-primary, #6366f1); }",
    ".mbr-send-btn { background: var(--mbr-primary, #6366f1); color: #fff; border: none; border-radius: 10px; width: 38px; height: 38px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex: 0 0 auto; }",
    ".mbr-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }",
    ".mbr-footer { text-align: center; padding: 6px 0 8px; font-size: 10.5px; color: #9aa0ac; flex: 0 0 auto; }",
    ".mbr-footer a { color: inherit; text-decoration: none; }",
    ".mbr-footer a:hover { text-decoration: underline; }",
    ".mbr-chips-wrap { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }",
    ".mbr-chip { border: 1px solid #dfe1e8; background: #fff; border-radius: 999px; padding: 6px 12px; font-size: 12px; cursor: pointer; color: #14141c; }",
    ".mbr-chip:hover { border-color: var(--mbr-primary, #6366f1); color: var(--mbr-primary, #6366f1); }",
    ".mbr-lead-form { display: flex; flex-direction: column; gap: 8px; padding: 12px; border: 1px solid #eceef2; border-radius: 12px; margin-top: 4px; }",
    ".mbr-lead-form-intro { font-size: 12.5px; color: #667085; margin: 0 0 2px; }",
    ".mbr-lead-input, .mbr-lead-textarea { border: 1px solid #dfe1e8; border-radius: 8px; padding: 8px 10px; font-size: 13px; outline: none; font-family: inherit; }",
    ".mbr-lead-input:focus, .mbr-lead-textarea:focus { border-color: var(--mbr-primary, #6366f1); }",
    ".mbr-lead-textarea { resize: none; min-height: 56px; }",
    ".mbr-lead-submit { background: var(--mbr-primary, #6366f1); color: #fff; border: none; border-radius: 8px; padding: 8px 12px; font-size: 13px; cursor: pointer; }",
    ".mbr-lead-submit:disabled { opacity: 0.6; cursor: not-allowed; }",
    ".mbr-lead-status { font-size: 11.5px; color: #e11d48; margin: 0; min-height: 14px; }",
    ".mbr-lead-thanks { font-size: 13px; color: #10b981; margin: 0; }",
  ].join("\n");

  function escapeForText(str) {
    return String(str == null ? "" : str);
  }

  class MBRChatWidget extends HTMLElement {
    constructor() {
      super();
      this._shadow = this.attachShadow({ mode: "open" });
      this._config = null;
      this._isOpen = false;
      this._releaseFocusTrap = null;
      this._isBusy = false;
      this._conversationId = null;
      this._conversationGeneration = 0;
      // Prompt 05 additions — human handoff (Section 3.3 / 4)
      this._realtimeClient = null;
      this._realtimeChannel = null;
      this._lastKnownStatus = "ai_handling";
    }
  }

  MBRChatWidget.prototype.connectedCallback = async function () {
    var self = this;
    try {
      self._config = await fetchConfig();
    } catch (err) {
      console.error("[MBR Chat Widget] Failed to load config:", err);
      return;
    }
    self._render();
  };

  MBRChatWidget.prototype._render = function () {
    var self = this;
    var cfg = this._config;
    var position = cfg.position === "bottom-left" ? "left" : "right";
    var reducedMotion = prefersReducedMotion();

    var style = document.createElement("style");
    style.textContent = WIDGET_CSS;
    this._shadow.appendChild(style);

    var root = document.createElement("div");
    root.className = reducedMotion ? "mbr-reduced-motion" : "";
    root.style.setProperty("--mbr-primary", cfg.primaryColor || "#6366f1");
    root.style.setProperty("--mbr-accent", cfg.accentColor || "#06b6d4");

    var launcher = document.createElement("button");
    launcher.className = "mbr-launcher mbr-pos-" + position;
    launcher.setAttribute(
      "aria-label",
      "Open chat with " + (cfg.orgName || "us"),
    );
    launcher.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';

    var panel = document.createElement("div");
    panel.className = "mbr-panel mbr-pos-" + position;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", (cfg.orgName || "Chat") + " assistant");

    var header = document.createElement("div");
    header.className = "mbr-header";
    var headerText = document.createElement("div");
    var headerTitle = document.createElement("div");
    headerTitle.className = "mbr-header-title";
    headerTitle.textContent = escapeForText(cfg.orgName || "Chat");
    var headerSub = document.createElement("div");
    headerSub.className = "mbr-header-sub";
    headerSub.textContent = "Usually replies instantly";
    headerText.appendChild(headerTitle);
    headerText.appendChild(headerSub);
    var newChatBtn = document.createElement("button");
    newChatBtn.className = "mbr-close-btn";
    newChatBtn.setAttribute("aria-label", "Start new conversation");
    newChatBtn.innerHTML =
      '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 1 2.64 6.36"/><path d="M3 21v-6h6"/></svg>';
    var closeBtn = document.createElement("button");
    closeBtn.className = "mbr-close-btn";
    closeBtn.setAttribute("aria-label", "Close chat");
    closeBtn.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>';
    var headerActions = document.createElement("div");
    headerActions.className = "mbr-header-actions";
    headerActions.appendChild(newChatBtn);
    var talkToHumanBtn = null;
    if (cfg.leadCapture && cfg.leadCapture.enabled) {
      talkToHumanBtn = document.createElement("button");
      talkToHumanBtn.className = "mbr-close-btn";
      talkToHumanBtn.setAttribute("aria-label", "Get in touch with the team");
      talkToHumanBtn.title = "Get in touch";
      talkToHumanBtn.innerHTML =
        '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
      headerActions.appendChild(talkToHumanBtn);
    }
    headerActions.appendChild(closeBtn);
    header.appendChild(headerText);
    header.appendChild(headerActions);

    var confirmBar = document.createElement("div");
    confirmBar.className = "mbr-confirm-bar";
    var confirmText = document.createElement("span");
    confirmText.textContent =
      "Start a new conversation? Your current chat will be cleared.";
    var confirmActions = document.createElement("div");
    confirmActions.className = "mbr-confirm-actions";
    var confirmCancelBtn = document.createElement("button");
    confirmCancelBtn.type = "button";
    confirmCancelBtn.className = "mbr-confirm-cancel";
    confirmCancelBtn.textContent = "Cancel";
    var confirmOkBtn = document.createElement("button");
    confirmOkBtn.type = "button";
    confirmOkBtn.className = "mbr-confirm-ok";
    confirmOkBtn.textContent = "Start new";
    confirmActions.appendChild(confirmCancelBtn);
    confirmActions.appendChild(confirmOkBtn);
    confirmBar.appendChild(confirmText);
    confirmBar.appendChild(confirmActions);

    var messages = document.createElement("div");
    messages.className = "mbr-messages";
    messages.setAttribute("aria-live", "polite");
    messages.setAttribute("aria-atomic", "false");

    if (cfg.welcomeMessage) {
      var welcome = document.createElement("div");
      welcome.className = "mbr-bubble mbr-bubble-assistant";
      welcome.textContent = cfg.welcomeMessage;
      messages.appendChild(welcome);
    }

    if (cfg.greetingChips && cfg.greetingChips.length > 0) {
      var chipsWrap = document.createElement("div");
      chipsWrap.className = "mbr-chips-wrap";
      cfg.greetingChips.forEach(function (chipLabel) {
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "mbr-chip";
        chip.textContent = chipLabel;
        chip.addEventListener("click", function () {
          chipsWrap.remove();
          self._sendMessage(chipLabel);
        });
        chipsWrap.appendChild(chip);
      });
      messages.appendChild(chipsWrap);
    }

    var inputRow = document.createElement("form");
    inputRow.className = "mbr-input-row";
    var input = document.createElement("input");
    input.className = "mbr-input";
    input.type = "text";
    input.placeholder = "Type a message...";
    input.setAttribute("aria-label", "Message");
    var sendBtn = document.createElement("button");
    sendBtn.type = "submit";
    sendBtn.className = "mbr-send-btn";
    sendBtn.setAttribute("aria-label", "Send message");
    sendBtn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>';
    inputRow.appendChild(input);
    inputRow.appendChild(sendBtn);

    var footer = document.createElement("div");
    footer.className = "mbr-footer";
    var footerLink = document.createElement("a");
    var campaign = encodeURIComponent(cfg.orgSlug || "widget");
    var defaultHref =
      API_BASE +
      "/?utm_source=widget&utm_medium=powered_by&utm_campaign=" +
      campaign;
    if (cfg.poweredByLabel) {
      footerLink.href = cfg.poweredByUrl || defaultHref;
      footerLink.textContent = cfg.poweredByLabel;
    } else {
      footerLink.href = defaultHref;
      footerLink.textContent = "Powered by MBR Studio";
    }
    footerLink.target = "_blank";
    footerLink.rel = "noopener noreferrer";
    footer.appendChild(footerLink);

    panel.appendChild(header);
    panel.appendChild(confirmBar);
    panel.appendChild(messages);
    panel.appendChild(inputRow);
    panel.appendChild(footer);

    root.appendChild(launcher);
    root.appendChild(panel);
    this._shadow.appendChild(root);

    this._els = {
      root: root,
      launcher: launcher,
      panel: panel,
      closeBtn: closeBtn,
      newChatBtn: newChatBtn,
      talkToHumanBtn: talkToHumanBtn,
      confirmBar: confirmBar,
      confirmCancelBtn: confirmCancelBtn,
      confirmOkBtn: confirmOkBtn,
      messages: messages,
      input: input,
      sendBtn: sendBtn,
      inputRow: inputRow,
    };

    launcher.addEventListener("click", function () {
      self._open();
    });
    closeBtn.addEventListener("click", function () {
      self._close();
    });
    newChatBtn.addEventListener("click", function () {
      self._requestNewConversation();
    });
    if (talkToHumanBtn) {
      talkToHumanBtn.addEventListener("click", function () {
        self._showLeadCaptureForm();
      });
    }
    confirmCancelBtn.addEventListener("click", function () {
      confirmBar.classList.remove("mbr-show");
    });
    confirmOkBtn.addEventListener("click", function () {
      confirmBar.classList.remove("mbr-show");
      self._resetConversation();
    });
    inputRow.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text || self._isBusy) return;
      input.value = "";
      self._sendMessage(text);
    });
  };

  MBRChatWidget.prototype._open = function () {
    if (this._isOpen) return;
    this._isOpen = true;
    this._els.panel.classList.add("mbr-open");
    var self = this;
    this._releaseFocusTrap = trapFocus(this._els.panel, function () {
      self._close();
    });
  };

  MBRChatWidget.prototype._close = function () {
    if (!this._isOpen) return;
    this._isOpen = false;
    this._els.panel.classList.remove("mbr-open");
    if (this._releaseFocusTrap) {
      this._releaseFocusTrap();
      this._releaseFocusTrap = null;
    }
    this._els.launcher.focus();
  };

  MBRChatWidget.prototype._requestNewConversation = function () {
    if (!this._els.messages.querySelector(".mbr-bubble")) {
      // Nothing sent yet — nothing to lose, reset straight away.
      this._resetConversation();
      return;
    }
    this._els.confirmBar.classList.add("mbr-show");
  };

  /**
   * Clears the transcript, drops the current conversationId (so the
   * next message has no id to send and app/api/widget/chat/route.ts's
   * find-or-create logic creates a brand-new conversation row), and
   * tears down the Realtime subscription tied to the old one.
   */
  MBRChatWidget.prototype._resetConversation = function () {
    var self = this;
    this._conversationGeneration++;

    if (this._realtimeChannel) {
      try {
        if (this._realtimeClient) {
          this._realtimeClient.removeChannel(this._realtimeChannel);
        } else {
          this._realtimeChannel.unsubscribe();
        }
      } catch (err) {
        console.error(
          "[MBR Chat Widget] Failed to tear down realtime channel:",
          err,
        );
      }
    }
    this._realtimeChannel = null;
    this._realtimeClient = null;
    this._lastKnownStatus = "ai_handling";
    this._conversationId = null;

    this._els.messages.innerHTML = "";
    this._els.input.value = "";
    this._els.confirmBar.classList.remove("mbr-show");

    var cfg = this._config;
    if (cfg.welcomeMessage) {
      var welcome = document.createElement("div");
      welcome.className = "mbr-bubble mbr-bubble-assistant";
      welcome.textContent = cfg.welcomeMessage;
      self._els.messages.appendChild(welcome);
    }
    if (cfg.greetingChips && cfg.greetingChips.length > 0) {
      var chipsWrap = document.createElement("div");
      chipsWrap.className = "mbr-chips-wrap";
      cfg.greetingChips.forEach(function (chipLabel) {
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "mbr-chip";
        chip.textContent = chipLabel;
        chip.addEventListener("click", function () {
          chipsWrap.remove();
          self._sendMessage(chipLabel);
        });
        chipsWrap.appendChild(chip);
      });
      self._els.messages.appendChild(chipsWrap);
    }
  };

  MBRChatWidget.prototype._addBubble = function (role, text) {
    var bubble = document.createElement("div");
    var variant =
      role === "human" ? "human" : role === "user" ? "user" : "assistant";
    bubble.className = "mbr-bubble mbr-bubble-" + variant;
    bubble.textContent = text;
    this._els.messages.appendChild(bubble);
    this._els.messages.scrollTop = this._els.messages.scrollHeight;
    return bubble;
  };

  /**
   * Inline system note (Section 4) — subtle centered gray text, used
   * for the handoff/hand-back announcements. Intentionally not a
   * modal or anything disruptive per the spec.
   */
  MBRChatWidget.prototype._addSystemNote = function (text) {
    var note = document.createElement("div");
    note.className = "mbr-system-note";
    note.textContent = text;
    this._els.messages.appendChild(note);
    this._els.messages.scrollTop = this._els.messages.scrollHeight;
  };

  MBRChatWidget.prototype._setBusy = function (busy) {
    this._isBusy = busy;
    this._els.sendBtn.disabled = busy;
    this._els.input.disabled = busy;
  };

  MBRChatWidget.prototype._showLeadCaptureForm = function () {
    var self = this;
    var cfg = this._config.leadCapture || {};

    if (self._els.messages.querySelector(".mbr-lead-form")) return;

    var wrap = document.createElement("form");
    wrap.className = "mbr-lead-form";

    var intro = document.createElement("p");
    intro.className = "mbr-lead-form-intro";
    intro.textContent = "Leave your details and the team will follow up.";
    wrap.appendChild(intro);

    var fields = {};
    function addField(key, placeholder, type) {
      var input = document.createElement("input");
      input.type = type || "text";
      input.placeholder = placeholder;
      input.className = "mbr-lead-input";
      input.setAttribute("aria-label", placeholder);
      wrap.appendChild(input);
      fields[key] = input;
    }

    if (cfg.askName !== false) addField("name", "Your name", "text");
    if (cfg.askEmail !== false) addField("email", "Your email", "email");
    if (cfg.askPhone) addField("phone", "Your phone (optional)", "tel");
    if (cfg.askMessage) {
      var textarea = document.createElement("textarea");
      textarea.placeholder = "Anything else? (optional)";
      textarea.className = "mbr-lead-textarea";
      wrap.appendChild(textarea);
      fields.message = textarea;
    }

    var submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.className = "mbr-lead-submit";
    submitBtn.textContent = "Send";
    wrap.appendChild(submitBtn);

    var statusEl = document.createElement("p");
    statusEl.className = "mbr-lead-status";
    wrap.appendChild(statusEl);

    wrap.addEventListener("submit", function (e) {
      e.preventDefault();
      var payload = {
        publicKey: CLIENT_KEY,
        visitorId: getVisitorId(),
        conversationId: self._conversationId || undefined,
        name: fields.name ? fields.name.value.trim() : "",
        email: fields.email ? fields.email.value.trim() : "",
        phone: fields.phone ? fields.phone.value.trim() : "",
        message: fields.message ? fields.message.value.trim() : "",
      };

      if (!payload.name && !payload.email && !payload.phone) {
        statusEl.textContent = "Please fill in at least one field.";
        return;
      }

      submitBtn.disabled = true;
      statusEl.textContent = "Sending...";

      fetch(API_BASE + "/api/widget/lead-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          if (data && data.success) {
            wrap.innerHTML = "";
            var thanks = document.createElement("p");
            thanks.className = "mbr-lead-thanks";
            thanks.textContent = "Thanks — the team will be in touch soon.";
            wrap.appendChild(thanks);
          } else {
            statusEl.textContent =
              (data && data.error) || "Something went wrong.";
            submitBtn.disabled = false;
          }
        })
        .catch(function () {
          statusEl.textContent = "Connection issue — please try again.";
          submitBtn.disabled = false;
        });
    });

    self._els.messages.appendChild(wrap);
    self._els.messages.scrollTop = self._els.messages.scrollHeight;
  };

  /**
   * Prompt 05, Section 3.3 / 4 — once we know our own conversationId,
   * subscribe to Realtime for exactly that conversation. This is the
   * ONLY subscription the widget ever opens: filtered server-side by
   * `conversation_id=eq.<id>` / `id=eq.<id>`, and backed by the narrow
   * anon RLS policies in migration 0011 (channel='website' only, and
   * only ever resolvable if you already know the unguessable id).
   *
   * Two things this listens for:
   *  - INSERT on `messages` with role 'human_agent' → a staff member
   *    replied from the dashboard inbox; render it live.
   *  - UPDATE on `conversations` → status flipped between
   *    'ai_handling' and 'human_handling'; show the inline note.
   *
   * Uses a dynamic import of @supabase/supabase-js from a CDN rather
   * than bundling it, since this widget ships as a single hand-written
   * vanilla-JS file with no build step (see docs/prompt-02 notes on
   * bundle size) — this only loads for visitors whose conversation has
   * actually started, not on initial widget mount.
   */
  MBRChatWidget.prototype._subscribeRealtime = async function () {
    var self = this;
    if (this._realtimeChannel || !this._conversationId) return;
    if (!this._config.supabaseUrl || !this._config.supabaseAnonKey) return;

    var supabaseModule;
    try {
      supabaseModule = await import("https://esm.sh/@supabase/supabase-js@2");
    } catch (err) {
      console.error("[MBR Chat Widget] Failed to load realtime client:", err);
      return;
    }

    try {
      this._realtimeClient = supabaseModule.createClient(
        this._config.supabaseUrl,
        this._config.supabaseAnonKey,
      );

      this._realtimeChannel = this._realtimeClient
        .channel("conversation:" + this._conversationId)
        .on("broadcast", { event: "human_message" }, function (payload) {
          self._addBubble("human", payload.payload.content);
        })
        .on("broadcast", { event: "status_changed" }, function (payload) {
          var newStatus = payload.payload.status;
          if (newStatus === self._lastKnownStatus) return;

          if (newStatus === "human_handling") {
            self._addSystemNote(
              "You're now chatting with " +
                (self._config.orgName || "the team") +
                "'s team.",
            );
          } else if (
            newStatus === "ai_handling" &&
            self._lastKnownStatus === "human_handling"
          ) {
            self._addSystemNote(
              "You're back to chatting with the AI assistant.",
            );
          }

          self._lastKnownStatus = newStatus;
        })
        .subscribe();
    } catch (err) {
      console.error("[MBR Chat Widget] Realtime subscription failed:", err);
    }
  };

  MBRChatWidget.prototype._sendMessage = async function (text) {
    var self = this;
    var generation = self._conversationGeneration;
    self._addBubble("user", text);
    self._setBusy(true);

    var typing = document.createElement("div");
    typing.className = "mbr-typing";
    typing.innerHTML = "<span></span>";
    self._els.messages.appendChild(typing);
    self._els.messages.scrollTop = self._els.messages.scrollHeight;

    try {
      var res = await fetch(API_BASE + "/api/widget/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey: CLIENT_KEY,
          visitorId: getVisitorId(),
          message: text,
          pageUrl: window.location.href,
        }),
      });

      typing.remove();

      if (generation !== self._conversationGeneration) {
        // A new conversation was started while this request was in
        // flight — discard the stale response.
        return;
      }

      var convHeader = res.headers.get("X-Conversation-Id");
      if (convHeader && convHeader !== self._conversationId) {
        self._conversationId = convHeader;
        // First time we learn our conversation id — open the
        // Realtime subscription for it (Prompt 05).
        self._subscribeRealtime();
      }

      var contentType = res.headers.get("content-type") || "";

      if (!res.ok) {
        var errBody =
          contentType.indexOf("application/json") !== -1
            ? await res.json().catch(function () {
                return {};
              })
            : {};
        self._addBubble(
          "assistant",
          errBody.error || "Something went wrong — please try again.",
        );
        self._setBusy(false);
        return;
      }

      if (contentType.indexOf("application/json") !== -1) {
        var data = await res.json();
        self._addBubble(
          "assistant",
          data.reply || "Sorry, I couldn't process that.",
        );
        self._setBusy(false);
        return;
      }

      if (res.body && res.body.getReader) {
        var reader = res.body.getReader();
        var decoder = new TextDecoder();
        var bubble = self._addBubble("assistant", "");
        var full = "";
        var chunk;
        while (!(chunk = await reader.read()).done) {
          full += decoder.decode(chunk.value, { stream: true });
          var displayText =
            full.indexOf(LEAD_CAPTURE_MARKER) !== -1
              ? full.split(LEAD_CAPTURE_MARKER)[0]
              : full;
          bubble.textContent = displayText;
          self._els.messages.scrollTop = self._els.messages.scrollHeight;
        }
        if (!full.trim())
          bubble.textContent =
            "Sorry, I didn't catch that — could you rephrase?";

        if (
          full.indexOf(LEAD_CAPTURE_MARKER) !== -1 &&
          self._config.leadCapture &&
          self._config.leadCapture.enabled
        ) {
          self._showLeadCaptureForm();
        }
      } else {
        var text2 = await res.text();
        self._addBubble("assistant", text2 || "Sorry, I didn't catch that.");
      }
    } catch (err) {
      typing.remove();
      if (generation === self._conversationGeneration) {
        console.error("[MBR Chat Widget] send failed:", err);
        self._addBubble(
          "assistant",
          "Connection issue — please try again in a moment.",
        );
      }
    }

    if (generation === self._conversationGeneration) {
      self._setBusy(false);
    }
  };

  if (!customElements.get("mbr-chat-widget")) {
    customElements.define("mbr-chat-widget", MBRChatWidget);
  }

  function mount() {
    if (document.querySelector("mbr-chat-widget")) return;
    var el = document.createElement("mbr-chat-widget");
    document.body.appendChild(el);
  }

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
