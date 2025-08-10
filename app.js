(function () {
  "use strict";

  const state = {
    signedIn: false,
    connected: { youtube: false, instagram: false, reddit: false },
    tags: new Set(),
    platform: "all",
    contentKinds: new Set(["video", "image", "text"]),
    sort: "recommended",
    search: ""
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const elements = {
    feed: $("#feed"),
    searchInput: $("#searchInput"),
    sortSelect: $("#sortSelect"),
    platformFilter: $("#platformFilter"),
    contentFilters: $$(".contentFilter"),
    activeTags: $("#activeTags"),
    clearFiltersBtn: $("#clearFiltersBtn"),
    tagInput: $("#tagInput"),
    modalTagInput: $("#modalTagInput"),
    signInBtn: $("#signInBtn"),
    userAvatar: $("#userAvatar"),
    aiSpinner: $("#aiSpinner"),
    aiStatus: $("#aiStatus"),

    // modal
    modal: $("#authModal"),
    backdrop: $("#modalBackdrop"),
    closeModalBtn: $("#closeModalBtn"),
    mockSignIn: $("#mockSignIn"),
    finishOnboarding: $("#finishOnboarding")
  };

  const mockPosts = generateMockPosts();

  function generateMockPosts() {
    const sample = [
      {
        id: "yt1",
        platform: "youtube",
        kind: "video",
        title: "Understanding Async/Await in JavaScript",
        description: "A friendly walkthrough with examples and tips.",
        time: "2h",
        tags: ["javascript", "webdev", "tutorial"],
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop"
      },
      {
        id: "ig1",
        platform: "instagram",
        kind: "image",
        title: "Sunset street photography",
        description: "Golden hour in Lisbon with a 35mm prime.",
        time: "4h",
        tags: ["photography", "street", "travel"],
        image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop"
      },
      {
        id: "rd1",
        platform: "reddit",
        kind: "text",
        title: "What are your 2025 web dev stack picks?",
        description: "Thread discussing frameworks, runtimes, and tools.",
        time: "6h",
        tags: ["webdev", "discussion", "frameworks"],
        image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop"
      },
      {
        id: "yt2",
        platform: "youtube",
        kind: "video",
        title: "10 design tips for better dashboards",
        description: "Balance, contrast, typography, and layout tricks.",
        time: "1d",
        tags: ["design", "ui", "ux"],
        image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop"
      },
      {
        id: "ig2",
        platform: "instagram",
        kind: "image",
        title: "Minimal Workspace Setup",
        description: "Clean desk, natural light, focus mode.",
        time: "1d",
        tags: ["workspace", "minimal", "productivity"],
        image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop"
      },
      {
        id: "rd2",
        platform: "reddit",
        kind: "text",
        title: "ELI5: Vector embeddings",
        description: "A simple explanation of what embeddings are and why they matter.",
        time: "2d",
        tags: ["ai", "ml", "explainlikeimfive"],
        image: "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=1200&auto=format&fit=crop"
      }
    ];

    // add some variety
    const extra = [];
    const platforms = ["youtube", "instagram", "reddit"];
    const kinds = ["video", "image", "text"];
    const tagPool = ["javascript", "webdev", "react", "ai", "design", "travel", "photography", "fitness", "startup", "news"];

    for (let i = 0; i < 18; i++) {
      const platform = platforms[i % platforms.length];
      const kind = kinds[i % kinds.length];
      const titleBase = {
        youtube: "Creator Spotlight",
        instagram: "Daily Inspiration",
        reddit: "Community Thread"
      }[platform];
      extra.push({
        id: `${platform}-${i}`,
        platform,
        kind,
        title: `${titleBase} #${i + 1}`,
        description: "Curated by AI based on your interests.",
        time: `${(i % 5) + 1}h`,
        tags: shuffle(tagPool).slice(0, 3),
        image: `https://picsum.photos/seed/${platform}-${i}/800/450`
      });
    }

    return [...sample, ...extra];
  }

  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

  function render() {
    const posts = applyFiltersAndSorting(mockPosts);
    renderActiveTags();
    renderFeed(posts);
    elements.aiSpinner.style.display = "none";
    elements.aiStatus.textContent = `${posts.length} posts • filtered by AI`;
  }

  function applyFiltersAndSorting(items) {
    let results = items.filter(p => state.platform === "all" || p.platform === state.platform);
    results = results.filter(p => state.contentKinds.has(p.kind));

    if (state.tags.size > 0) {
      results = results.filter(p => p.tags.some(t => state.tags.has(t.toLowerCase())));
    }

    if (state.search.trim()) {
      const q = state.search.toLowerCase();
      results = results.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    if (state.sort === "new") results = results.reverse();
    if (state.sort === "popular") results = shuffle(results);

    return results;
  }

  function renderFeed(posts) {
    elements.feed.innerHTML = "";
    const tpl = $("#cardTemplate");

    posts.forEach(post => {
      const node = tpl.content.cloneNode(true);
      const article = node.querySelector(".post-card");
      const media = node.querySelector(".media");
      const img = node.querySelector("img");
      const duration = node.querySelector(".duration");
      const badge = node.querySelector(".badge");
      const time = node.querySelector(".time");
      const title = node.querySelector(".title");
      const description = node.querySelector(".description");
      const tags = node.querySelector(".tags");

      media.dataset.kind = post.kind === "video" ? "video" : "image";
      img.src = post.image;
      img.alt = post.title;
      duration.style.display = post.kind === "video" ? "inline-block" : "none";

      badge.textContent = capitalize(post.platform);
      time.textContent = post.time;
      title.textContent = post.title;
      description.textContent = post.description;

      post.tags.forEach(t => {
        const chip = document.createElement("button");
        chip.className = "chip";
        chip.textContent = t;
        chip.addEventListener("click", () => addTag(t));
        tags.appendChild(chip);
      });

      article.dataset.platform = post.platform;
      article.dataset.kind = post.kind;

      elements.feed.appendChild(node);
    });
  }

  function renderActiveTags() {
    elements.activeTags.innerHTML = "";
    state.tags.forEach(t => {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.innerHTML = `<span>#${escapeHtml(t)}</span> <button class="x" aria-label="Remove">×</button>`;
      tag.querySelector(".x").addEventListener("click", () => removeTag(t));
      elements.activeTags.appendChild(tag);
    });
  }

  function addTag(raw) {
    const t = String(raw || "").trim().toLowerCase();
    if (!t) return;
    state.tags.add(t);
    syncTagInputs();
    render();
  }

  function removeTag(raw) {
    const t = String(raw || "").trim().toLowerCase();
    if (!t) return;
    state.tags.delete(t);
    syncTagInputs();
    render();
  }

  function syncTagInputs() {
    // main input
    hydrateTagInput(elements.tagInput, state.tags);
    // modal input
    if (elements.modalTagInput) hydrateTagInput(elements.modalTagInput, state.tags);
  }

  function hydrateTagInput(container, tags) {
    if (!container) return;
    container.innerHTML = "";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = container.dataset.placeholder || "Add a tag";

    const placeholder = document.createElement("span");
    placeholder.className = "placeholder";
    placeholder.textContent = container.dataset.placeholder || "Add a tag";

    if (tags.size === 0) container.appendChild(placeholder);

    tags.forEach(t => container.appendChild(makeTagChip(t)));
    container.appendChild(input);

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        addTag(input.value);
        input.value = "";
      } else if (e.key === "Backspace" && input.value === "") {
        const last = Array.from(state.tags).at(-1);
        if (last) removeTag(last);
      }
    });

    container.addEventListener("click", () => input.focus());
  }

  function makeTagChip(text) {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.innerHTML = `<span>#${escapeHtml(text)}</span> <button class="x" aria-label="Remove">×</button>`;
    tag.querySelector(".x").addEventListener("click", () => removeTag(text));
    return tag;
  }

  function bindPlatformFilter() {
    $$(".pill", elements.platformFilter).forEach(btn => {
      btn.addEventListener("click", () => {
        $$(".pill", elements.platformFilter).forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.platform = btn.dataset.platform;
        render();
      });
    });
  }

  function bindContentFilters() {
    elements.contentFilters.forEach(cb => {
      cb.addEventListener("change", () => {
        if (cb.checked) state.contentKinds.add(cb.value);
        else state.contentKinds.delete(cb.value);
        render();
      });
    });
  }

  function bindSortAndSearch() {
    elements.sortSelect.addEventListener("change", () => {
      state.sort = elements.sortSelect.value;
      render();
    });
    elements.searchInput.addEventListener("input", () => {
      state.search = elements.searchInput.value;
      render();
    });
    elements.clearFiltersBtn.addEventListener("click", () => {
      state.tags.clear();
      state.search = "";
      elements.searchInput.value = "";
      syncTagInputs();
      render();
    });
  }

  function bindPresetChips() {
    $$(".preset-tags .chip").forEach(chip => {
      chip.addEventListener("click", () => addTag(chip.dataset.tag));
    });
  }

  function bindConnectButtons(root = document) {
    $$(".connect", root).forEach(btn => {
      btn.addEventListener("click", () => {
        const p = btn.dataset.platform;
        state.connected[p] = !state.connected[p];
        btn.classList.toggle("connected", state.connected[p]);
        btn.textContent = state.connected[p] ? "Connected" : "Connect";
      });
    });
  }

  function bindAuthFlow() {
    function openModal() {
      elements.modal.classList.add("active");
      elements.backdrop.classList.add("active");
    }
    function closeModal() {
      elements.modal.classList.remove("active");
      elements.backdrop.classList.remove("active");
    }

    function go(step) {
      const steps = ["step1", "step2", "step3"];
      steps.forEach((id, idx) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.toggle("hidden", id !== step);
        const li = $$(".steps li")[idx];
        if (li) li.classList.toggle("active", id === step);
      });
      if (step === "step2") syncTagInputs();
    }

    elements.signInBtn.addEventListener("click", () => {
      openModal();
      go("step1");
    });
    elements.closeModalBtn.addEventListener("click", closeModal);
    elements.backdrop.addEventListener("click", closeModal);

    elements.mockSignIn.addEventListener("click", () => {
      state.signedIn = true;
      elements.userAvatar.classList.remove("hidden");
      elements.signInBtn.classList.add("hidden");
      go("step2");
    });

    $$('[data-next]').forEach(b => b.addEventListener('click', () => go("step3")));
    $$('[data-prev]').forEach(b => b.addEventListener('click', () => go("step2")));

    elements.finishOnboarding.addEventListener("click", () => {
      closeModal();
      // pretend AI scan
      elements.aiSpinner.style.display = "inline-block";
      elements.aiStatus.textContent = "AI scanning your channels…";
      setTimeout(() => {
        render();
      }, 600);
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // bootstrap
  bindPlatformFilter();
  bindContentFilters();
  bindSortAndSearch();
  bindPresetChips();
  bindConnectButtons();
  bindAuthFlow();
  syncTagInputs();

  // initial render with tiny delay to show spinner
  setTimeout(render, 400);
})();
