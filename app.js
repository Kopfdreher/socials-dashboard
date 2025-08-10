(function () {
  "use strict";

  const state = {
    signedIn: false,
    connected: { youtube: false },
    tags: new Set(),
    platform: "youtube",
    contentKinds: new Set(["video"]), // retained for code simplicity; UI filters removed
    sort: "recommended",
    search: ""
  };

  const ALLOWED_TAGS = new Set([
    "development",
    "design",
    "ux-ui",
    "wisdom",
    "growth",
    "podcast",
    "finance",
    "learn",
    "focus"
  ]);

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

  const VIDEO_URLS = [
    "https://www.youtube.com/watch?v=j6Ule7GXaRs",
    "https://www.youtube.com/watch?v=1NTKwpAVcHg",
    "https://www.youtube.com/watch?v=wIuVvCuiJhU",
    "https://www.youtube.com/watch?v=TBIjgBVFjVI",
    "https://www.youtube.com/watch?v=A89FMtIkWKc",
    "https://www.youtube.com/watch?v=cKTU4fcttZ0",
    "https://www.youtube.com/watch?v=Q-zuTZuYeCg",
    "https://www.youtube.com/watch?v=VleyqM4ubng",
    "https://www.youtube.com/watch?v=cUO4K_66z5w",
    "https://www.youtube.com/watch?v=4W64WGFy-Js",
    "https://www.youtube.com/watch?v=gZ5K4iReUnE",
    "https://www.youtube.com/watch?v=yvuPkfGpsYM",
    "https://www.youtube.com/watch?v=oGSHKXEKT2Q",
    "https://www.youtube.com/watch?v=Z4Q9P_EhiY0",
    "https://www.youtube.com/watch?v=WzrALzUnZ0g",
    "https://www.youtube.com/watch?v=l86xggdQcKQ"
  ];

  const mockPosts = generateMockPosts();
  hydrateVideoMetadata(mockPosts).catch(() => {/* ignore */});

  function generateMockPosts() {
    const posts = VIDEO_URLS.map((url, idx) => {
      const vid = extractVideoId(url);
      return {
        id: `yt-${idx}`,
        platform: "youtube",
        kind: "video",
        videoId: vid,
        url,
        title: "Loading…",
        description: "",
        time: "",
        tags: [],
        image: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`
      };
    });
    return posts;
  }

  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

  function render() {
    let posts = [];
    try {
      posts = applyFiltersAndSorting(mockPosts);
    renderActiveTags();
    renderFeed(posts);
    } catch (err) {
      console.error("Render error:", err);
    } finally {
      if (elements.aiSpinner) elements.aiSpinner.style.display = "none";
      if (elements.aiStatus) elements.aiStatus.textContent = `${posts.length} posts • filtered by AI`;
    }
  }

  function applyFiltersAndSorting(items) {
    // Only filter by tags; no platform, kind, or text search filtering
    let results = items.slice();

    if (state.tags.size > 0) {
      results = results.filter(p => p.tags.some(t => state.tags.has(t.toLowerCase())));
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
      const time = node.querySelector(".time");
      const title = node.querySelector(".title");
      const description = node.querySelector(".description");
      const tags = node.querySelector(".tags");

      media.dataset.kind = "video";
      // Show only thumbnail in the grid (no overlays)
      if (img) {
        img.src = post.image || img.src;
        img.alt = post.title || "Video thumbnail";
      }
      media.style.cursor = "pointer";
      media.addEventListener("click", () => openVideoFullscreen(post));
      // no duration badge in template anymore

      time.textContent = post.time || "";
      title.textContent = post.title || "";
      description.textContent = post.description || "";

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
    if (!t || !ALLOWED_TAGS.has(t)) return;
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
    if (!elements.platformFilter) return;
    $$(".pill", elements.platformFilter).forEach(btn => {
      btn.addEventListener("click", () => {
        $$(".pill", elements.platformFilter).forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.platform = btn.dataset.platform;
        render();
      });
    });
  }

  function bindContentFilters() { /* no-op: filters removed */ }

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
      state.search = ""; // search no longer filters results
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

  function extractVideoId(url) {
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
      return u.searchParams.get("v") || "";
    } catch { return ""; }
  }

  function shortenToWords(text, count) {
    const words = String(text || "").trim().split(/\s+/);
    return words.slice(0, count).join(" ");
  }

  function deriveTagsFromTitle(title) {
    const t = String(title || "").toLowerCase();
    const chosen = [];
    const tryAdd = (tag) => {
      if (ALLOWED_TAGS.has(tag) && !chosen.includes(tag)) chosen.push(tag);
    };
    if (/(dev|code|program|javascript|typescript|react|next|api|engineer)/.test(t)) tryAdd("development");
    if (/(design|ui|visual|layout|typography)/.test(t)) tryAdd("design");
    if (/(ux|ui|accessibility|usability)/.test(t)) tryAdd("ux-ui");
    if (/(mindset|advice|wisdom|philosophy|insight|lessons)/.test(t)) tryAdd("wisdom");
    if (/(growth|scale|startup|marketing|strategy)/.test(t)) tryAdd("growth");
    if (/(podcast|episode|talk|interview)/.test(t)) tryAdd("podcast");
    if (/(finance|money|invest|budget|market|stocks|crypto)/.test(t)) tryAdd("finance");
    if (/(learn|tutorial|guide|course|how to|tips|tricks)/.test(t)) tryAdd("learn");
    if (/(focus|productivity|deep work|concentration)/.test(t)) tryAdd("focus");
    if (chosen.length === 0) tryAdd("focus");
    while (chosen.length < 3) {
      // pad with reasonable defaults but keep within allowed set
      for (const pad of ["learn", "development", "design", "ux-ui", "growth", "wisdom", "podcast", "finance", "focus"]) {
        if (chosen.length >= 3) break;
        tryAdd(pad);
      }
      break;
    }
    return chosen.slice(0, 3);
  }

  async function hydrateVideoMetadata(posts) {
    const apiKey = window.YT_API_KEY || localStorage.getItem("YT_API_KEY") || "";
    if (apiKey) {
      // Fetch in batches (max 50 IDs per request)
      const ids = posts.map(p => p.videoId).filter(Boolean);
      function* chunk(arr, size) {
        for (let i = 0; i < arr.length; i += size) {
          yield arr.slice(i, i + size);
        }
      }
      for (const group of chunk(ids, 45)) {
        const resp = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${group.join(',')}&key=${apiKey}`);
        const data = await resp.json();
        const map = new Map();
        (data.items || []).forEach(item => map.set(item.id, item.snippet));
        posts.forEach(p => {
          const sn = map.get(p.videoId);
          if (!sn) return;
          p.title = sn.title || p.title;
          p.description = shortenToWords(sn.description || "", 10);
          p.tags = deriveTagsFromTitle(p.title);
          if (sn.thumbnails && sn.thumbnails.high) p.image = sn.thumbnails.high.url;
        });
      }
      render();
      return;
    }

    // Fallback to oEmbed for titles if no API key
    await Promise.all(posts.map(async (p) => {
      try {
        const resp = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(p.url)}&format=json`);
        if (!resp.ok) return;
        const data = await resp.json();
        p.title = data.title || p.title;
        p.tags = deriveTagsFromTitle(p.title);
      } catch { /* ignore */ }
    }));
    render();
  }

  function openVideoFullscreen(post) {
    const overlay = document.createElement("div");
    overlay.className = "video-fullscreen";
    const wrap = document.createElement("div");
    wrap.className = "player-wrap";
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${post.videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`;
    iframe.title = post.title || "YouTube video";
    iframe.frameBorder = "0";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    wrap.appendChild(iframe);

    const closeBtn = document.createElement("button");
    closeBtn.className = "close-btn";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", close);

    overlay.appendChild(wrap);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);

    function onKey(e) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", onKey);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

    function close() {
      document.removeEventListener("keydown", onKey);
      overlay.remove();
    }
  }

  // bootstrap (robust against missing elements)
  try { bindPlatformFilter(); } catch {}
  try { bindContentFilters(); } catch {}
  try { bindSortAndSearch(); } catch {}
  try { bindPresetChips(); } catch {}
  try { bindConnectButtons(); } catch {}
  try { bindAuthFlow(); } catch {}
  try { syncTagInputs(); } catch {}

  function safeInitialRender() {
    try { render(); }
    catch {
      if (elements.aiSpinner) elements.aiSpinner.style.display = "none";
      if (elements.aiStatus) elements.aiStatus.textContent = "Ready";
    }
  }

  // initial render
  safeInitialRender();
})();
