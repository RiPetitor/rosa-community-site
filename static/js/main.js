/**
 * РОСА Linux Community Site
 * Главный JavaScript файл
 */

(function () {
  "use strict";

  // ==========================================
  // Модальные окна
  // ==========================================

  class Modal {
    constructor(modalElement) {
      this.modal = modalElement;
      this.isOpen = false;

      this.handleKeydown = this.handleKeydown.bind(this);
      this.close = this.close.bind(this);

      this.modal.querySelectorAll("[data-close-modal]").forEach((btn) => {
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

      const firstFocusable = this.modal.querySelector("button, [href], input");
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
  }

  // Инициализация модальных окон
  const modals = {};
  document.querySelectorAll(".modal").forEach((modalEl) => {
    modals[modalEl.id] = new Modal(modalEl);
  });

  document.querySelectorAll("[data-open-modal]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const modalId = btn.getAttribute("data-open-modal");
      if (modals[modalId]) modals[modalId].open();
    });
  });

  // ==========================================
  // Кнопка копирования кода (современный стиль)
  // ==========================================

  function initCodeCopy() {
    document.querySelectorAll("pre").forEach((pre) => {
      // Создаём обёртку
      const wrapper = document.createElement("div");
      wrapper.className = "code-block";
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      // Кнопка копирования — иконка
      const copyBtn = document.createElement("button");
      copyBtn.className = "code-copy";
      copyBtn.setAttribute("aria-label", "Копировать код");
      copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>`;

      wrapper.appendChild(copyBtn);

      copyBtn.addEventListener("click", async () => {
        const code = pre.querySelector("code")?.textContent || pre.textContent;

        try {
          await navigator.clipboard.writeText(code);
          copyBtn.classList.add("copied");
          copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>`;

          setTimeout(() => {
            copyBtn.classList.remove("copied");
            copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>`;
          }, 2000);
        } catch (err) {
          console.error("Copy failed:", err);
        }
      });
    });
  }

  // ==========================================
  // Поиск по документации (горячая клавиша /)
  // ==========================================

  function initSearch() {
    const searchInput = document.querySelector(".docs-search input");
    if (!searchInput) return;

    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
        e.preventDefault();
        searchInput.focus();
      }
    });
  }

  // ==========================================
  // Поиск по документации (результаты)
  // ==========================================

  function initDocsSearch() {
    const input = document.querySelector("[data-search-input]");
    const resultsEl = document.querySelector("[data-search-results]");
    const navEl = document.querySelector(".docs-nav");
    if (!input || !resultsEl) return;

    const sidebar = input.closest(".docs-sidebar");
    const indexUrl = input.dataset.searchIndex || "/search_index.json";
    const scope = input.dataset.searchScope || "/docs/";
    let docs = [];
    let indexLoaded = false;
    let loadPromise = null;

    const normalize = (value) =>
      (value || "").toString().replace(/\s+/g, " ").trim().toLowerCase();

    const buildDocs = (data) => {
      const store = data?.documentStore?.docs || {};
      docs = Object.values(store)
        .filter((doc) => (doc.path || "").startsWith(scope))
        .map((doc) => {
          const body = (doc.body || "").replace(/\s+/g, " ").trim();
          return {
            title: doc.title || doc.path || "",
            description: (doc.description || "").trim(),
            body,
            path: doc.path || doc.id || "#",
            _title: normalize(doc.title),
            _description: normalize(doc.description),
            _body: normalize(body),
          };
        });
    };

    const loadIndex = async () => {
      if (indexLoaded) return;
      if (!loadPromise) {
        loadPromise = fetch(indexUrl)
          .then((res) => {
            if (!res.ok) throw new Error("index fetch failed");
            return res.json();
          })
          .catch(() => fetch("/search_index.json").then((res) => res.json()))
          .then((data) => {
            buildDocs(data);
            indexLoaded = true;
          })
          .catch((err) => {
            console.error("Search index load failed:", err);
          });
      }
      await loadPromise;
    };

    const scoreDoc = (doc, tokens) => {
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
    };

    const buildSnippet = (doc, tokens) => {
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
    };

    const renderResults = (results, tokens) => {
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
        title.href = doc.path;
        title.textContent = doc.title;

        const path = document.createElement("span");
        path.className = "search-result-path";
        path.textContent = doc.path;

        const snippetText = buildSnippet(doc, tokens);

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
    };

    const clearResults = () => {
      resultsEl.innerHTML = "";
      resultsEl.hidden = true;
      if (sidebar) sidebar.classList.remove("search-active");
      if (navEl) navEl.hidden = false;
    };

    input.addEventListener("input", async () => {
      const query = input.value.trim();
      if (query.length < 2) {
        clearResults();
        return;
      }

      await loadIndex();
      if (!docs.length) {
        clearResults();
        return;
      }

      const tokens = query
        .split(/\s+/)
        .map((t) => t.toLowerCase())
        .filter((t) => t.length > 1);

      if (!tokens.length) {
        clearResults();
        return;
      }

      const results = docs
        .map((doc) => ({ doc, score: scoreDoc(doc, tokens) }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 12)
        .map((entry) => entry.doc);

      renderResults(results, tokens);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        input.value = "";
        clearResults();
        input.blur();
      }
    });
  }

  // ==========================================
  // Table of Contents — подсветка активного
  // ==========================================

  function initTocHighlight() {
    const tocLinks = document.querySelectorAll(".docs-toc a, .blog-toc a");
    if (!tocLinks.length) return;

    const headings = [];
    tocLinks.forEach((link) => {
      const id = link.getAttribute("href")?.slice(1);
      const heading = id && document.getElementById(id);
      if (heading) headings.push({ el: heading, link });
    });

    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            tocLinks.forEach((l) => l.classList.remove("active"));
            const active = headings.find((h) => h.el === entry.target);
            if (active) active.link.classList.add("active");
          }
        });
      },
      { rootMargin: "-100px 0px -66%" },
    );

    headings.forEach((h) => observer.observe(h.el));
  }

  // ==========================================
  // Плавная прокрутка к якорям
  // ==========================================

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
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
  }

  // ==========================================
  // Анимация при появлении
  // ==========================================

  function initScrollAnimations() {
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

    document
      .querySelectorAll(".article, .download-edition, .docs-card")
      .forEach((el) => {
        observer.observe(el);
      });
  }

  // ==========================================
  // Инициализация
  // ==========================================

  document.addEventListener("DOMContentLoaded", () => {
    initCodeCopy();
    initSearch();
    initDocsSearch();
    initTocHighlight();
    initSmoothScroll();
    initScrollAnimations();
  });
})();
