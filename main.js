"use strict";
(() => {
  // core/elements.ts
  var VALENCE_OPTIONS = [
    { id: "positive", emoji: "sentiment_satisfied", label: "Positive", color: "#3a8f5e", bg: "#e8f5ee" },
    { id: "neutral", emoji: "sentiment_neutral", label: "Neutral", color: "#777", bg: "#f0f0f0" },
    { id: "negative", emoji: "sentiment_dissatisfied", label: "Negative", color: "#b85540", bg: "#faecea" },
    { id: "unsure", emoji: "circle", label: "Unsure", color: "#9a8030", bg: "#faf5e4" }
  ];
  var DEFAULT_LABELS = [
    "Strongly disagree",
    "Slightly disagree",
    "Somewhat/Neutral",
    "Mostly agree",
    "Completely agree"
  ];
  var ROW_STYLES = `
  :host { display: block; font-family: Georgia, "Times New Roman", serif; }

  .card {
    background: #fafaf8; border: 1px solid #e4e1db;
    border-radius: 10px; overflow: hidden;
    transition: box-shadow 0.15s;
  }
  .card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.07); }

  .row {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 16px 10px;
  }

  .question {
    flex: 0 0 320px;
    font-size: 13.5px; line-height: 1.5;
    color: #2a2a2a; font-style: italic;
  }

  /* \u2500\u2500 Likert track \u2500\u2500 */
  .likert-track {
    flex: 1; display: flex; align-items: center;
    position: relative; min-width: 0;
  }
  .track-line {
    position: absolute; top: 32.5%;
    left: 11px; right: 11px; height: 1px;
    background: #e4e1db; transform: translateY(-50%);
    pointer-events: none;
  }
  .likert-option {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; gap: 4px;
    position: relative; z-index: 1;
  }

  /* Plain dot \u2014 likert-scale and unselected valence dots */
  .dot {
    width: 26px; height: 26px; border-radius: 50%;
    border: 2px solid #ccc; background: #fff; cursor: pointer;
    transition: border-color .14s, background .14s, transform .12s, font-size .12s;
    display: flex; align-items: center; justify-content: center;
    padding: 0; box-sizing: border-box;
    font-size: 0;           /* emoji hidden on plain dots */
    line-height: 1;
    user-select: none;
  }
  .dot:hover { border-color: #48a; background: #e8f0f8; transform: scale(1.15); }

  /* Selected plain dot (likert-scale only) */
  .dot[aria-checked="true"] {
    border-color: #3a6ea5; background: #48a;
    transform: scale(1.1);
  }

  /* Selected valence dot \u2014 becomes the emoji, loses circle styling */
  .dot.valence-active {
    border-color: transparent !important;
    background: transparent !important;
    transform: scale(1.35) !important;
    font-size: 20px !important;   /* reveals the emoji character */
  }

  .dot-label {
    font-size: 9.5px; color: #999; font-style: italic;
    text-align: center; 
    max-width: 156px; 
    line-height: 1.25;
    pointer-events: none;
    user-select: none; 
    white-space: nowrap;
    text-wrap: wrap;
  }

  /* \u2500\u2500 Valence stepper buttons \u2500\u2500 */
  /* Each .likert-option that is active gets visible steppers.        */
  /* They are absolutely positioned above and below the dot.          */
  /* On inactive options they exist in the DOM but are invisible.     */
  .v-step {
    position: absolute;
    left: 50%; transform: translateX(-50%);
    background: none; border: none; cursor: pointer; padding: 0;
    font-size: 24px; line-height: 1; color: #888;
    transition: opacity .15s, color .15s;
    opacity: 0; pointer-events: none;
    user-select: none;
  }
  .v-step-up   { top: -26px; }
  .v-step-down { bottom: -22px; }
  .v-step:hover { color: #666; }

  .likert-option.valence-selected .v-step {
    opacity: 1; pointer-events: auto;
  }

  /* \u2500\u2500 Elaboration textarea \u2500\u2500 */
  .elab-wrap {
    border-top: 1px solid #f0ede7;
    background: #48a;
    padding: 0 16px;
    max-height: 2px; 
    overflow: hidden;
    transition: max-height .2s ease, padding .2s ease, background .2s ease;
  }
  .elab-wrap:hover:not(.open) { background: #3a6ea5; }
  .elab-wrap.open { 
    max-height: 120px; padding: 8px 16px 10px; 
    background: unset;
    }
  .elab-ta {
    width: 100%; box-sizing: border-box;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 12px; font-style: italic; color: #555;
    line-height: 1.5; border: none; outline: none;
    background: transparent; resize: none; overflow: hidden;
    min-height: 20px; display: block;
  }

  .material-symbols-outlined {
    font-family: 'Material Symbols Outlined';
    font-weight: normal;
    font-style: normal;
    font-size: 24px;  /* Preferred icon size */
    display: inline-block;
    line-height: 1;
    text-transform: none;
    letter-spacing: normal;
    word-wrap: normal;
    white-space: nowrap;
    direction: ltr;
  }
`;
  function getLabels(el) {
    const attr = el.getAttribute("likert-labels");
    if (!attr) return DEFAULT_LABELS;
    const parts = attr.split(",").map((s) => s.trim());
    return parts.length === 5 ? parts : DEFAULT_LABELS;
  }
  function syncDots(dots, likert) {
    dots.forEach((dot, i) => {
      const sel = likert === i + 1;
      dot.setAttribute("aria-checked", String(sel));
      dot.setAttribute("tabindex", sel || likert === null && i === 0 ? "0" : "-1");
    });
  }
  function buildLikertTrack(dots, labels, onClickFn, onKeyFn) {
    const track = document.createElement("div");
    track.className = "likert-track";
    const line = document.createElement("div");
    line.className = "track-line";
    track.appendChild(line);
    for (let i = 0; i < 5; i++) {
      const opt = document.createElement("div");
      opt.className = "likert-option";
      const dot = document.createElement("button");
      dot.className = "dot";
      dot.type = "button";
      dot.setAttribute("role", "radio");
      dot.setAttribute("aria-checked", "false");
      dot.setAttribute("aria-label", labels[i] ?? String(i + 1));
      dot.setAttribute("tabindex", i === 0 ? "0" : "-1");
      dot.addEventListener("click", () => onClickFn(i + 1));
      dot.addEventListener("keydown", (e) => onKeyFn(e, i));
      dots.push(dot);
      const lbl = document.createElement("span");
      lbl.className = "dot-label";
      lbl.textContent = labels[i] ?? "";
      lbl.setAttribute("aria-hidden", "true");
      opt.appendChild(dot);
      opt.appendChild(lbl);
      track.appendChild(opt);
    }
    return track;
  }
  function buildElaboration(baseName, onChangeFn) {
    const wrap = document.createElement("div");
    wrap.className = "elab-wrap";
    const ta = document.createElement("textarea");
    ta.className = "elab-ta";
    ta.name = baseName + "_elab";
    ta.placeholder = "If you\u2019d like to say more about your response, you can do so here\u2026";
    ta.rows = 1;
    ta.setAttribute("aria-label", "Elaboration (optional)");
    ta.addEventListener("focus", () => wrap.classList.add("open"));
    ta.addEventListener("input", () => {
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
      onChangeFn();
    });
    ta.addEventListener("change", onChangeFn);
    ta.addEventListener("blur", () => {
      if (!ta.value.trim()) wrap.classList.remove("open");
    });
    wrap.appendChild(ta);
    return { wrap, textarea: ta };
  }
  var LikertScaleElement = class extends HTMLElement {
    constructor() {
      super();
      this._likert = null;
      this._dots = [];
      this._elabTA = null;
      this._internals = this.attachInternals();
      this._shadow = this.attachShadow({ mode: "open" });
      this._render();
    }
    static get observedAttributes() {
      return ["question", "likert", "likert-labels", "reverse", "elaboration"];
    }
    connectedCallback() {
      const la = this.getAttribute("likert");
      if (la !== null) {
        const n = parseInt(la, 10);
        if (n >= 1 && n <= 5) this._likert = n;
      }
      syncDots(this._dots, this._likert);
      this._commit();
    }
    attributeChangedCallback(name, _old, _new) {
      if (name === "question") {
        const q = this._shadow.querySelector(".question");
        if (q) q.textContent = _new ?? "";
        return;
      }
      if (name === "likert-labels") {
        const labels = getLabels(this);
        this._shadow.querySelectorAll(".dot-label").forEach((el, i) => {
          el.textContent = labels[i] ?? "";
        });
        this._dots.forEach((d, i) => d.setAttribute("aria-label", labels[i] ?? String(i + 1)));
        return;
      }
      if (name === "likert" && _new !== null) {
        const n = parseInt(_new, 10);
        if (n >= 1 && n <= 5) {
          this._likert = n;
          syncDots(this._dots, n);
          this._commit();
        }
        return;
      }
      this._render();
    }
    get value() {
      return this._likert;
    }
    set value(v) {
      this._likert = v;
      syncDots(this._dots, v);
      this._commit();
    }
    get likert() {
      return this._likert;
    }
    get elab() {
      return this._elabTA?.value ?? "";
    }
    set elab(v) {
      if (!this._elabTA) return;
      this._elabTA.value = v;
      if (v.trim()) this._shadow.querySelector(".elab-wrap")?.classList.add("open");
    }
    get serialisedValue() {
      const rev = this.hasAttribute("reverse") ? ";reverse:true" : "";
      const elab = this.elab ? `;elab:${this.elab}` : "";
      return `likert:${this._likert ?? "null"}${rev}${elab}`;
    }
    _render() {
      const labels = getLabels(this);
      const question = this.getAttribute("question") ?? "";
      const reversed = this.hasAttribute("reverse");
      const hasElab = this.hasAttribute("elaboration");
      this._shadow.innerHTML = "";
      const style = document.createElement("style");
      style.textContent = ROW_STYLES;
      this._shadow.appendChild(style);
      const card = document.createElement("div");
      card.className = "card";
      const row = document.createElement("div");
      row.className = "row";
      row.setAttribute("role", "group");
      const qEl = document.createElement("div");
      qEl.className = reversed ? "question reverse" : "question";
      qEl.textContent = question;
      row.appendChild(qEl);
      this._dots = [];
      row.appendChild(buildLikertTrack(
        this._dots,
        labels,
        (v) => {
          this._likert = this._likert === v ? null : v;
          syncDots(this._dots, this._likert);
          this._commit();
          this._dispatch();
        },
        (e, i) => {
          let next = null;
          if (e.key === "ArrowRight") next = Math.min(i + 1, 4);
          if (e.key === "ArrowLeft") next = Math.max(i - 1, 0);
          if (next !== null) {
            e.preventDefault();
            this._dots[next]?.focus();
            this._likert = next + 1;
            syncDots(this._dots, this._likert);
            this._commit();
            this._dispatch();
          }
        }
      ));
      card.appendChild(row);
      if (hasElab) {
        const { wrap, textarea } = buildElaboration(
          this.getAttribute("name") ?? "q",
          () => {
            this._commit();
            this._dispatch();
          }
        );
        this._elabTA = textarea;
        card.appendChild(wrap);
      } else {
        this._elabTA = null;
      }
      this._shadow.appendChild(card);
    }
    _commit() {
      this._internals.setFormValue(this.serialisedValue);
      this._internals.setValidity({});
    }
    _dispatch() {
      this.dispatchEvent(new CustomEvent("change", {
        detail: { likert: this._likert, elab: this.elab },
        bubbles: true,
        composed: true
      }));
    }
  };
  LikertScaleElement.formAssociated = true;
  var LikertValenceElement = class extends HTMLElement {
    constructor() {
      super();
      this._likert = null;
      this._valence = "unsure";
      this._dots = [];
      this._elabTA = null;
      this._internals = this.attachInternals();
      this._shadow = this.attachShadow({ mode: "open" });
      this._render();
    }
    static get observedAttributes() {
      return ["question", "tagged", "likert", "valence", "likert-labels", "elaboration"];
    }
    connectedCallback() {
      const la = this.getAttribute("likert");
      if (la !== null) {
        const n = parseInt(la, 10);
        if (n >= 1 && n <= 5) this._likert = n;
      }
      const va = this.getAttribute("valence");
      if (va && VALENCE_OPTIONS.some((v) => v.id === va)) this._valence = va;
      syncDots(this._dots, this._likert);
      this._syncValence();
      this._commit();
    }
    attributeChangedCallback(name, _old, _new) {
      if (name === "question") {
        const q = this._shadow.querySelector(".question");
        if (q) q.textContent = _new ?? "";
        return;
      }
      if (name === "likert-labels") {
        const labels = getLabels(this);
        this._shadow.querySelectorAll(".dot-label").forEach((el, i) => {
          el.textContent = labels[i] ?? "";
        });
        this._dots.forEach((d, i) => d.setAttribute("aria-label", labels[i] ?? String(i + 1)));
        return;
      }
      if (name === "likert" && _new !== null) {
        const n = parseInt(_new, 10);
        if (n >= 1 && n <= 5) {
          this._likert = n;
          syncDots(this._dots, n);
          this._syncValence();
          this._commit();
        }
        return;
      }
      if (name === "valence" && _new && VALENCE_OPTIONS.some((v) => v.id === _new)) {
        this._valence = _new;
        this._syncValence();
        this._commit();
        return;
      }
      this._render();
      syncDots(this._dots, this._likert);
      this._syncValence();
    }
    get value() {
      return { likert: this._likert, valence: this._valence, elab: this.elab };
    }
    set value(v) {
      if (v.likert !== void 0) this._likert = v.likert;
      if (v.valence !== void 0) this._valence = v.valence;
      syncDots(this._dots, this._likert);
      this._syncValence();
      if (v.elab !== void 0) this.elab = v.elab;
      this._commit();
    }
    get likert() {
      return this._likert;
    }
    get valence() {
      return this._valence;
    }
    get elab() {
      return this._elabTA?.value ?? "";
    }
    set elab(v) {
      if (!this._elabTA) return;
      this._elabTA.value = v;
      if (v.trim()) this._shadow.querySelector(".elab-wrap")?.classList.add("open");
    }
    get serialisedValue() {
      const elab = this.elab ? `;elab:${this.elab}` : "";
      return `likert:${this._likert ?? "null"};valence:${this._valence}${elab}`;
    }
    _render() {
      const labels = getLabels(this);
      const question = this.getAttribute("question") ?? "";
      const tagged = this.hasAttribute("tagged");
      const hasElab = this.hasAttribute("elaboration");
      this._shadow.innerHTML = "";
      const style = document.createElement("style");
      style.textContent = ROW_STYLES;
      this._shadow.appendChild(style);
      const card = document.createElement("div");
      card.className = "card";
      const row = document.createElement("div");
      row.className = "row";
      row.style.paddingTop = tagged ? "26px" : "";
      row.style.paddingBottom = tagged ? "22px" : "";
      row.setAttribute("role", "group");
      row.setAttribute("aria-label", question);
      const qEl = document.createElement("div");
      qEl.className = "question";
      qEl.textContent = question;
      row.appendChild(qEl);
      this._dots = [];
      const track = buildLikertTrack(
        this._dots,
        labels,
        (v) => {
          this._likert = this._likert === v ? null : v;
          syncDots(this._dots, this._likert);
          this._syncValence();
          this._commit();
          this._dispatch();
        },
        (e, i) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            const next = Math.min(i + 1, 4);
            this._dots[next]?.focus();
            this._likert = next + 1;
            syncDots(this._dots, this._likert);
            this._syncValence();
            this._commit();
            this._dispatch();
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            const next = Math.max(i - 1, 0);
            this._dots[next]?.focus();
            this._likert = next + 1;
            syncDots(this._dots, this._likert);
            this._syncValence();
            this._commit();
            this._dispatch();
          } else if (e.key === "ArrowUp" && tagged) {
            e.preventDefault();
            this._step(-1);
          } else if (e.key === "ArrowDown" && tagged) {
            e.preventDefault();
            this._step(1);
          }
        }
      );
      if (tagged) {
        this._dots.forEach((_dot, i) => {
          const opt = track.querySelectorAll(".likert-option")[i];
          if (!opt) return;
          const up = document.createElement("button");
          up.className = "v-step v-step-up";
          up.type = "button";
          up.textContent = "\u23F6";
          up.setAttribute("aria-label", "Previous feeling");
          up.setAttribute("tabindex", "-1");
          up.addEventListener("click", (e) => {
            e.stopPropagation();
            this._step(-1);
          });
          const down = document.createElement("button");
          down.className = "v-step v-step-down";
          down.type = "button";
          down.textContent = "\u23F7";
          down.setAttribute("aria-label", "Next feeling");
          down.setAttribute("tabindex", "-1");
          down.addEventListener("click", (e) => {
            e.stopPropagation();
            this._step(1);
          });
          opt.appendChild(up);
          opt.appendChild(down);
        });
      }
      row.appendChild(track);
      card.appendChild(row);
      if (hasElab) {
        const { wrap, textarea } = buildElaboration(
          this.getAttribute("name") ?? "q",
          () => {
            this._commit();
            this._dispatch();
          }
        );
        this._elabTA = textarea;
        card.appendChild(wrap);
      } else {
        this._elabTA = null;
      }
      this._shadow.appendChild(card);
    }
    _step(dir) {
      const idx = VALENCE_OPTIONS.findIndex((v) => v.id === this._valence);
      this._valence = VALENCE_OPTIONS[(idx + dir + VALENCE_OPTIONS.length) % VALENCE_OPTIONS.length].id;
      this._syncValence();
      this._commit();
      this._dispatch();
    }
    _syncValence() {
      const opt = VALENCE_OPTIONS.find((v) => v.id === this._valence);
      const activeIdx = this._likert !== null ? this._likert - 1 : -1;
      this._dots.forEach((dot, i) => {
        const isActive = i === activeIdx;
        const optEl = dot.parentElement;
        if (isActive) {
          dot.innerHTML = `<span class="material-symbols-outlined">${opt.emoji}</span>`;
          dot.classList.add("valence-active");
          dot.setAttribute("aria-label", `${DEFAULT_LABELS[i] ?? String(i + 1)} \u2014 feeling: ${opt.label}`);
          optEl?.classList.add("valence-selected");
        } else {
          dot.textContent = "";
          dot.classList.remove("valence-active");
          dot.setAttribute("aria-label", DEFAULT_LABELS[i] ?? String(i + 1));
          optEl?.classList.remove("valence-selected");
        }
      });
    }
    _commit() {
      this._internals.setFormValue(this.serialisedValue);
      this._internals.setValidity({});
    }
    _dispatch() {
      this.dispatchEvent(new CustomEvent("change", {
        detail: this.value,
        bubbles: true,
        composed: true
      }));
    }
  };
  LikertValenceElement.formAssociated = true;
  function registerElements() {
    if (!customElements.get("likert-scale")) {
      customElements.define("likert-scale", LikertScaleElement);
    }
    if (!customElements.get("likert-valence")) {
      customElements.define("likert-valence", LikertValenceElement);
    }
  }

  // core/survey.ts
  var _config = { storageKey: "survey_v1", submitUrl: "", submitSecret: "", interviewUrl: "" };
  var pages = [];
  var totalPages = 0;
  var currentPage = 0;
  var form = document.getElementById("surveyForm");
  var btnNext = document.getElementById("btnNext");
  var btnBack = document.getElementById("btnBack");
  var progressFill = document.getElementById("progressFill");
  var progressLabel = document.getElementById("progressLabel");
  var pageIndicator = document.getElementById("pageIndicator");
  var nav = document.getElementById("nav");
  var submittedNotice = document.getElementById("submittedNotice");
  var restoreBanner = document.getElementById("restoreBanner");
  var progressWrap = document.getElementById("progressWrap");
  function init(doc) {
    _config = {
      storageKey: doc.storageKey,
      submitUrl: doc.submitUrl,
      submitSecret: doc.submitSecret,
      interviewUrl: doc.interviewUrl
    };
    pages = Array.from(document.querySelectorAll(".page"));
    totalPages = pages.length;
    form.addEventListener("change", saveToStorage);
    btnNext.addEventListener("click", onNext);
    btnBack.addEventListener("click", onBack);
    document.getElementById("restoreYes").addEventListener("click", onRestoreYes);
    document.getElementById("restoreNo").addEventListener("click", onRestoreNo);
    const saved = loadFromStorage();
    if (saved && Object.keys(saved).length > 1) {
      restoreBanner.classList.add("visible");
    } else {
      showPage(0);
    }
  }
  function showPage(idx) {
    pages.forEach((p, i) => p.classList.toggle("active", i === idx));
    currentPage = idx;
    btnBack.disabled = idx === 0;
    btnNext.textContent = idx === totalPages - 1 ? "Submit" : "Next \u2192";
    const pct = totalPages > 1 ? Math.round(idx / (totalPages - 1) * 100) : 100;
    progressFill.style.width = pct + "%";
    progressLabel.textContent = `${idx + 1} of ${totalPages}`;
    pageIndicator.textContent = `${idx + 1} / ${totalPages}`;
    saveToStorage();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function onNext() {
    if (currentPage === 0) {
      const consent = document.getElementById("consentCheck");
      if (consent && !consent.checked) {
        consent.closest("label").setAttribute("style", "color:#b85540");
        consent.focus();
        return;
      }
      consent?.closest("label").removeAttribute("style");
    }
    if (currentPage < totalPages - 1) {
      showPage(currentPage + 1);
    } else {
      submitSurvey();
    }
  }
  function onBack() {
    if (currentPage > 0) showPage(currentPage - 1);
  }
  function collectValues() {
    const out = {};
    const els = form.elements;
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      const name = el.getAttribute("name") || el.name;
      if (!name) continue;
      if (el instanceof LikertValenceElement) {
        out[name] = { type: "likert-valence", likert: el.likert, valence: el.valence, elab: el.elab };
      } else if (el instanceof LikertScaleElement) {
        out[name] = { type: "likert-scale", likert: el.likert, elab: el.elab };
      } else if (el instanceof HTMLInputElement && el.type === "checkbox") {
        out[name] = el.checked;
      } else if (el instanceof HTMLSelectElement || el instanceof HTMLInputElement) {
        out[name] = el.value;
      }
    }
    out["__page"] = currentPage;
    return out;
  }
  function applyValues(saved) {
    for (const [name, val] of Object.entries(saved)) {
      if (name === "__page") continue;
      const el = form.elements.namedItem(name) || form.querySelector(`[name="${name}"]`);
      if (!el) continue;
      if (el instanceof LikertValenceElement && typeof val === "object" && !Array.isArray(val) && val.type === "likert-valence") {
        const v = val;
        el.value = { likert: v.likert, valence: v.valence, elab: v.elab ?? "" };
      } else if (el instanceof LikertScaleElement && typeof val === "object" && !Array.isArray(val) && val.type === "likert-scale") {
        const v = val;
        el.value = v.likert;
        if (v.elab) el.elab = v.elab;
      } else if (el instanceof HTMLInputElement && el.type === "checkbox") {
        el.checked = Boolean(val);
      } else if (el instanceof HTMLSelectElement || el instanceof HTMLInputElement) {
        el.value = String(val);
      }
    }
  }
  function saveToStorage() {
    try {
      localStorage.setItem(_config.storageKey, JSON.stringify(collectValues()));
    } catch (_) {
    }
  }
  function loadFromStorage() {
    try {
      return JSON.parse(localStorage.getItem(_config.storageKey) || "null");
    } catch (_) {
      return null;
    }
  }
  function clearStorage() {
    try {
      localStorage.removeItem(_config.storageKey);
    } catch (_) {
    }
  }
  function onRestoreYes() {
    restoreBanner.classList.remove("visible");
    const saved = loadFromStorage();
    if (!saved) {
      showPage(0);
      return;
    }
    setTimeout(() => {
      applyValues(saved);
      showPage(saved.__page ?? 0);
    }, 0);
  }
  function onRestoreNo() {
    clearStorage();
    restoreBanner.classList.remove("visible");
    showPage(0);
  }
  async function submitSurvey() {
    const payload = collectValues();
    delete payload["__page"];
    payload["_submitted_at"] = (/* @__PURE__ */ new Date()).toISOString();
    if (!_config.submitUrl) {
      console.log("=== Survey submitted (no endpoint configured) ===");
      console.log(JSON.stringify(payload, null, 2));
      onSubmitComplete();
      return;
    }
    btnNext.disabled = true;
    btnNext.textContent = "Submitting\u2026";
    try {
      if (_config.submitSecret) {
        payload["_secret"] = _config.submitSecret;
      }
      await fetch(_config.submitUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload)
      });
      onSubmitComplete();
    } catch (err) {
      console.error("Submission failed:", err);
      btnNext.disabled = false;
      btnNext.textContent = "Submit";
      const errEl = document.getElementById("submitError");
      if (errEl) {
        errEl.textContent = "Submission failed \u2014 please try again, or contact the researcher.";
        errEl.style.display = "block";
      }
    }
  }
  function onSubmitComplete() {
    clearStorage();
    form.style.display = "none";
    nav.style.display = "none";
    progressWrap.style.display = "none";
    restoreBanner.classList.remove("visible");
    submittedNotice.classList.add("visible");
    if (_config.interviewUrl) initInterviewPanel();
  }
  function initInterviewPanel() {
    const panel = document.getElementById("interviewPanel");
    if (!panel) return;
    panel.style.display = "block";
    const emailInput = document.getElementById("interviewEmail");
    const msgInput = document.getElementById("interviewMessage");
    const btn = document.getElementById("interviewSubmit");
    const confirm = document.getElementById("interviewConfirm");
    const errEl = document.getElementById("interviewError");
    btn.addEventListener("click", async () => {
      const email = emailInput.value.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errEl.textContent = "Please enter a valid email address.";
        errEl.style.display = "block";
        return;
      }
      errEl.style.display = "none";
      btn.disabled = true;
      btn.textContent = "Sending\u2026";
      try {
        await fetch(_config.interviewUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            _secret: _config.submitSecret,
            _type: "interview",
            email,
            message: msgInput.value.trim()
          })
        });
        panel.style.display = "none";
        confirm.style.display = "block";
      } catch {
        btn.disabled = false;
        btn.textContent = "Send";
        errEl.textContent = "Something went wrong \u2014 please try again.";
        errEl.style.display = "block";
      }
    });
  }

  // core/main.ts
  registerElements();
  async function boot() {
    const meta = window.__SURVEY_META__;
    if (!meta) {
      showFatalError(
        "Survey metadata not found.",
        "This page must be produced by the build script.",
        "Run: node scripts/build.mjs <survey-name>"
      );
      return;
    }
    document.title = meta.title;
    await Promise.all([
      customElements.whenDefined("likert-scale"),
      customElements.whenDefined("likert-valence")
    ]);
    init(meta);
  }
  function showFatalError(...lines) {
    const el = document.getElementById("surveyForm");
    if (!el) return;
    el.innerHTML = `
    <div style="padding:24px;background:#fff3f3;border:1px solid #e4a0a0;border-radius:10px;
                font-family:Georgia,serif;font-size:13px;line-height:1.7;color:#5a2020;">
      <strong>Could not load survey</strong><br>
      ${lines.map((l) => `<span>${l}</span>`).join("<br>")}
    </div>`;
  }
  boot().catch((err) => console.error(err));
})();
