/**
 * ROSA Linux Community Site
 * @file main.js
 * @description Основной JS-файл сайта
 */

const RosaApp = (function () {
  "use strict";

  /** Конфигурация приложения */
  const config = {
    baseUrl: document.body?.dataset?.baseUrl || "",
    basePath: "",
    selectors: {
      modal: ".modal",
      openModal: "[data-open-modal]",
      closeModal: "[data-close-modal]",
      searchInput: "[data-search-input]",
      searchResults: "[data-search-results]",
      docsNav: ".docs-nav",
      docsSidebar: "[data-docs-sidebar]",
      docsSidebarOverlay: "[data-docs-sidebar-overlay]",
      docsSidebarToggle: "[data-docs-sidebar-toggle]",
      navToggle: ".nav-toggle",
      mainNav: "#main-nav",
      codeBlocks: "pre",
      animatedElements: ".article, .download-edition, .docs-card",
    },
  };

  try {
    if (config.baseUrl) {
      config.basePath = new URL(config.baseUrl).pathname.replace(/\/$/, "");
    }
  } catch (err) {
    config.basePath = "";
  }

  /** Вспомогательные функции */
  const utils = {
    /**
     * Добавляет basePath к пути
     * @param {string} path - путь
     * @returns {string}
     */
    withBasePath(path) {
      if (!path || !path.startsWith("/")) return path;
      if (!config.basePath || config.basePath === "/") return path;
      if (path.startsWith(config.basePath + "/") || path === config.basePath) {
        return path;
      }
      return `${config.basePath}${path}`;
    },

    /**
     * Нормализует строку для поиска
     * @param {string} value
     * @returns {string}
     */
    normalize(value) {
      return (value || "").toString().replace(/\s+/g, " ").trim().toLowerCase();
    },

    /** Обёртка для querySelector */
    $(selector, context = document) {
      return context.querySelector(selector);
    },

    /** Обёртка для querySelectorAll */
    $$(selector, context = document) {
      return context.querySelectorAll(selector);
    },
  };

  /**
   * Модуль модальных окон
   * Управляет открытием/закрытием модалок через data-атрибуты
   */
  const modalModule = {
    instances: {},

    Modal: class {
      constructor(modalElement) {
        this.modal = modalElement;
        this.isOpen = false;
        this.handleKeydown = this.handleKeydown.bind(this);
        this.close = this.close.bind(this);

        utils.$$(config.selectors.closeModal, this.modal).forEach((btn) => {
          btn.addEventListener("click", (e) => {
            if (e.target === btn || e.target.hasAttribute("data-close-modal")) {
              this.close();
            }
          });
        });
      }

      open() {
        this.modal.setAttribute("aria-hidden", "false");
        this.isOpen = true;
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", this.handleKeydown);

        const firstFocusable = utils.$("button, [href], input", this.modal);
        if (firstFocusable) firstFocusable.focus();
      }

      close() {
        this.modal.setAttribute("aria-hidden", "true");
        this.isOpen = false;
        document.body.style.overflow = "";
        document.removeEventListener("keydown", this.handleKeydown);
      }

      handleKeydown(e) {
        if (e.key === "Escape") this.close();
      }
    },

    init() {
      utils.$$(config.selectors.modal).forEach((modalEl) => {
        this.instances[modalEl.id] = new this.Modal(modalEl);
      });

      utils.$$(config.selectors.openModal).forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const modalId = btn.getAttribute("data-open-modal");
          if (this.instances[modalId]) this.instances[modalId].open();
        });
      });
    },
  };

  /**
   * Модуль копирования кода
   * Добавляет кнопку копирования к блокам <pre>
   */
  const codeCopyModule = {
    copyIcon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>`,

    checkIcon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>`,

    init() {
      utils.$$(config.selectors.codeBlocks).forEach((pre) => {
        const wrapper = document.createElement("div");
        wrapper.className = "code-block";
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        const copyBtn = document.createElement("button");
        copyBtn.className = "code-copy";
        copyBtn.setAttribute("aria-label", "Копировать код");
        copyBtn.innerHTML = this.copyIcon;
        wrapper.appendChild(copyBtn);

        copyBtn.addEventListener("click", () => this.handleCopy(pre, copyBtn));
      });
    },

    /**
     * Копирует содержимое блока кода в буфер
     * @param {HTMLElement} pre - элемент pre
     * @param {HTMLElement} btn - кнопка копирования
     */
    async handleCopy(pre, btn) {
      const code = utils.$("code", pre)?.textContent || pre.textContent;

      try {
        await navigator.clipboard.writeText(code);
        btn.classList.add("copied");
        btn.innerHTML = this.checkIcon;

        setTimeout(() => {
          btn.classList.remove("copied");
          btn.innerHTML = this.copyIcon;
        }, 2000);
      } catch (err) {
        console.error("Copy failed:", err);
      }
    },
  };

  /**
   * Модуль поиска по документации
   * Загружает индекс и фильтрует результаты
   */
  const searchModule = {
    docs: [],
    indexLoaded: false,
    loadPromise: null,

    init() {
      this.initHotkey();
      this.initDocsSearch();
    },

    /** Горячая клавиша "/" для фокуса на поиск */
    initHotkey() {
      const searchInput = utils.$(".docs-search input");
      if (!searchInput) return;

      document.addEventListener("keydown", (e) => {
        if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
          e.preventDefault();
          searchInput.focus();
        }
      });
    },

    initDocsSearch() {
      const input = utils.$(config.selectors.searchInput);
      const resultsEl = utils.$(config.selectors.searchResults);
      const navEl = utils.$(config.selectors.docsNav);
      if (!input || !resultsEl) return;

      const sidebar = input.closest(".docs-sidebar");
      const indexUrl =
        input.dataset.searchIndex ||
        (config.basePath
          ? `${config.basePath}/search_index.json`
          : "/search_index.json");
      const scope = input.dataset.searchScope || "/docs/";

      input.addEventListener("input", async () => {
        const query = input.value.trim();
        if (query.length < 2) {
          this.clearResults(resultsEl, sidebar, navEl);
          return;
        }

        await this.loadIndex(indexUrl, scope);
        if (!this.docs.length) {
          this.clearResults(resultsEl, sidebar, navEl);
          return;
        }

        const tokens = query
          .split(/\s+/)
          .map((t) => t.toLowerCase())
          .filter((t) => t.length > 1);
        if (!tokens.length) {
          this.clearResults(resultsEl, sidebar, navEl);
          return;
        }

        const results = this.search(tokens);
        this.renderResults(results, tokens, resultsEl, sidebar, navEl);
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          input.value = "";
          this.clearResults(resultsEl, sidebar, navEl);
          input.blur();
        }
      });
    },

    /**
     * Загружает поисковый индекс
     * @param {string} indexUrl - URL индекса
     * @param {string} scope - область поиска (например /docs/)
     */
    async loadIndex(indexUrl, scope) {
      if (this.indexLoaded) return;
      if (!this.loadPromise) {
        this.loadPromise = fetch(indexUrl)
          .then((res) => {
            if (!res.ok) throw new Error("index fetch failed");
            return res.json();
          })
          .catch(() =>
            fetch(
              config.basePath
                ? `${config.basePath}/search_index.json`
                : "/search_index.json",
            ).then((res) => res.json()),
          )
          .then((data) => {
            this.buildDocs(data, scope);
            this.indexLoaded = true;
          })
          .catch((err) => console.error("Search index load failed:", err));
      }
      await this.loadPromise;
    },

    /** Строит массив документов из индекса */
    buildDocs(data, scope) {
      const store = data?.documentStore?.docs || {};
      this.docs = Object.values(store)
        .filter((doc) => (doc.path || "").startsWith(scope))
        .map((doc) => {
          const body = (doc.body || "").replace(/\s+/g, " ").trim();
          return {
            title: doc.title || doc.path || "",
            description: (doc.description || "").trim(),
            body,
            path: doc.path || doc.id || "#",
            _title: utils.normalize(doc.title),
            _description: utils.normalize(doc.description),
            _body: utils.normalize(body),
          };
        });
    },

    /** Поиск по токенам, возвращает топ-12 результатов */
    search(tokens) {
      return this.docs
        .map((doc) => ({ doc, score: this.scoreDoc(doc, tokens) }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 12)
        .map((entry) => entry.doc);
    },

    /** Подсчёт релевантности документа */
    scoreDoc(doc, tokens) {
      let score = 0;
      for (const token of tokens) {
        const inTitle = doc._title.includes(token);
        const inDesc = doc._description.includes(token);
        const inBody = doc._body.includes(token);

        if (!inTitle && !inDesc && !inBody) return 0;

        if (inTitle) score += 6;
        if (inDesc) score += 3;
        if (inBody) score += 1;
      }
      return score;
    },

    /** Формирует сниппет с контекстом вокруг найденного слова */
    buildSnippet(doc, tokens) {
      if (doc.description) return doc.description;
      const text = doc.body || "";
      if (!text) return "";

      const lower = text.toLowerCase();
      let idx = -1;
      for (const token of tokens) {
        idx = lower.indexOf(token);
        if (idx !== -1) break;
      }

      if (idx === -1) {
        return text.length > 140 ? `${text.slice(0, 140)}…` : text;
      }

      const start = Math.max(0, idx - 60);
      const end = Math.min(text.length, idx + 80);
      let snippet = text.slice(start, end).trim();
      if (start > 0) snippet = `…${snippet}`;
      if (end < text.length) snippet = `${snippet}…`;
      return snippet;
    },

    /** Отрисовка результатов поиска */
    renderResults(results, tokens, resultsEl, sidebar, navEl) {
      resultsEl.innerHTML = "";

      if (!results.length) {
        const empty = document.createElement("div");
        empty.className = "search-empty";
        empty.textContent = "Ничего не найдено";
        resultsEl.appendChild(empty);
        resultsEl.hidden = false;
        if (sidebar) sidebar.classList.add("search-active");
        if (navEl) navEl.hidden = true;
        return;
      }

      const list = document.createElement("ul");
      list.className = "search-result-list";

      results.forEach((doc) => {
        const item = document.createElement("li");
        item.className = "search-result-item";

        const title = document.createElement("a");
        title.className = "search-result-title";
        title.href = utils.withBasePath(doc.path);
        title.textContent = doc.title;

        const path = document.createElement("span");
        path.className = "search-result-path";
        path.textContent = doc.path;

        const snippetText = this.buildSnippet(doc, tokens);

        item.appendChild(title);
        if (snippetText) {
          const snippet = document.createElement("p");
          snippet.className = "search-result-snippet";
          snippet.textContent = snippetText;
          item.appendChild(snippet);
        }
        item.appendChild(path);
        list.appendChild(item);
      });

      resultsEl.appendChild(list);
      resultsEl.hidden = false;
      if (sidebar) sidebar.classList.add("search-active");
      if (navEl) navEl.hidden = true;
    },

    /** Очистка результатов */
    clearResults(resultsEl, sidebar, navEl) {
      resultsEl.innerHTML = "";
      resultsEl.hidden = true;
      if (sidebar) sidebar.classList.remove("search-active");
      if (navEl) navEl.hidden = false;
    },
  };

  /**
   * Модуль навигации
   * Мобильное меню, сайдбар документации, плавный скролл
   */
  const navigationModule = {
    init() {
      this.initMobileNav();
      this.initDocsSidebar();
      this.initSmoothScroll();
    },

    /** Мобильное меню */
    initMobileNav() {
      const toggle = utils.$(config.selectors.navToggle);
      const nav = utils.$(config.selectors.mainNav);
      if (!toggle || !nav) return;

      document.body.classList.add("has-js");

      const setState = (open) => {
        document.body.classList.toggle("nav-open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.setAttribute(
          "aria-label",
          open ? "Закрыть меню" : "Открыть меню",
        );

        if (open) {
          document.body.classList.remove("docs-sidebar-open");
          utils.$$(config.selectors.docsSidebarToggle).forEach((btn) => {
            btn.setAttribute("aria-expanded", "false");
          });
        }
      };

      toggle.addEventListener("click", () => {
        const isOpen = !document.body.classList.contains("nav-open");
        setState(isOpen);
      });

      utils.$$("a", nav).forEach((link) => {
        link.addEventListener("click", () => setState(false));
      });

      document.addEventListener("click", (event) => {
        if (!document.body.classList.contains("nav-open")) return;
        if (toggle.contains(event.target) || nav.contains(event.target)) return;
        setState(false);
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setState(false);
      });
    },

    /** Выдвижной сайдбар документации (мобильный) */
    initDocsSidebar() {
      const sidebar = utils.$(config.selectors.docsSidebar);
      const overlay = utils.$(config.selectors.docsSidebarOverlay);
      const toggles = utils.$$(config.selectors.docsSidebarToggle);
      if (!sidebar || !toggles.length) return;

      document.body.classList.add("has-docs-js");

      const setState = (open) => {
        document.body.classList.toggle("docs-sidebar-open", open);
        toggles.forEach((toggle) => {
          toggle.setAttribute("aria-expanded", open ? "true" : "false");
        });

        if (open) {
          document.body.classList.remove("nav-open");
          const mainToggle = utils.$(config.selectors.navToggle);
          if (mainToggle) mainToggle.setAttribute("aria-expanded", "false");
        }
      };

      toggles.forEach((toggle) => {
        toggle.addEventListener("click", () => {
          const isOpen = !document.body.classList.contains("docs-sidebar-open");
          setState(isOpen);
        });
      });

      if (overlay) {
        overlay.addEventListener("click", () => setState(false));
      }

      sidebar.addEventListener("click", (event) => {
        if (event.target.closest("a")) setState(false);
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setState(false);
      });

      const media = window.matchMedia("(min-width: 1025px)");
      const handleChange = (e) => {
        if (e.matches) setState(false);
      };
      if (media.addEventListener) {
        media.addEventListener("change", handleChange);
      } else if (media.addListener) {
        media.addListener(handleChange);
      }

      this.initCollapsibleSections(sidebar);
    },

    /**
     * Сворачиваемые разделы в сайдбаре
     * Состояние сохраняется в localStorage
     */
    initCollapsibleSections(sidebar) {
      const STORAGE_KEY = "docs-nav-expanded";
      const navGroups = sidebar.querySelectorAll("[data-nav-group]");
      if (!navGroups.length) return;

      let expanded = {};
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) expanded = JSON.parse(stored);
      } catch (e) {
        // localStorage недоступен
      }

      navGroups.forEach((group) => {
        const id = group.dataset.navGroup;
        if (expanded[id] === true) {
          group.setAttribute("open", "");
        }
      });

      navGroups.forEach((group) => {
        group.addEventListener("toggle", () => {
          const id = group.dataset.navGroup;
          if (group.open) {
            expanded[id] = true;
          } else {
            delete expanded[id];
          }

          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(expanded));
          } catch (e) {
            // localStorage недоступен
          }
        });
      });
    },

    /** Плавный скролл по якорным ссылкам */
    initSmoothScroll() {
      utils.$$('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
          const targetId = this.getAttribute("href").slice(1);
          const target = document.getElementById(targetId);

          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
            history.pushState(null, null, `#${targetId}`);
          }
        });
      });
    },
  };

  /**
   * Модуль анимаций
   * Добавляет класс animate-visible при появлении элемента в viewport
   */
  const animationsModule = {
    init() {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("animate-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 },
      );

      utils.$$(config.selectors.animatedElements).forEach((el) => {
        observer.observe(el);
      });
    },
  };

  /** Публичный API */
  return {
    config,
    utils,

    init() {
      modalModule.init();
      codeCopyModule.init();
      searchModule.init();
      navigationModule.init();
      animationsModule.init();
    },

    modules: {
      modal: modalModule,
      codeCopy: codeCopyModule,
      search: searchModule,
      navigation: navigationModule,
      animations: animationsModule,
    },
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  RosaApp.init();
});
