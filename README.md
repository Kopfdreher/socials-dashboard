# 🧘 ZenView

**ZenView** is a minimalist, focus-oriented dashboard concept for YouTube. It is designed to strip away the algorithmic noise and clutter of modern social media, replacing it with a clean, "Zen" interface that organizes content based on your specific learning interests and tags.

## ✨ Features

* **Distraction-Free Interface:** A sleek, dark-themed UI (`#0b0d10`) designed to reduce eye strain and cognitive load.
* **Interest-Based Filtering:** Instead of an algorithmic "For You" page, users define tags (e.g., `#development`, `#finance`, `#design`) to filter the feed.
* **Smart "AI" Categorization:** The app simulates an AI scanner that analyzes video titles to automatically assign relevant tags like "Wisdom," "Growth," or "Focus."
* **Immersive Playback:** Clicking a video opens a custom, full-screen overlay player that hides comments and recommendations.
* **Responsive Grid:** A masonry-style grid layout that adapts from desktop to mobile screens seamlessly.
* **Mock Authentication Flow:** A demonstrated onboarding experience including sign-in, interest selection, and platform connection steps.

## 🛠️ Tech Stack

This project is built with pure **Vanilla Web Standards**. No build tools or frameworks are required.

* **HTML5:** Semantic markup with accessible modals and ARIA attributes.
* **CSS3:** Native CSS Variables for theming, CSS Grid/Flexbox for layout, and backdrop-filters for glassmorphism effects.
* **JavaScript (ES6+):** Modular, strict-mode JS handling DOM manipulation, state management, and async data fetching.

## 📂 Project Structure

```text
.
├── index.html    # The main application shell and template definitions
├── styles.css    # Global design system, dark theme variables, and responsive rules
└── app.js        # Logic for feed rendering, tag filtering, and API interactions

```

## 🚀 How to Run

Because this project uses standard web technologies, there is no complex installation process.

1. **Download** the three files (`index.html`, `styles.css`, `app.js`) into a single folder.
2. **Open** `index.html` in your modern web browser (Chrome, Firefox, Edge, Safari).

*Tip: For the best experience (to avoid CORS issues with icons or fonts), serve the folder using a local server like the VS Code "Live Server" extension or Python's `http.server`.*

## ⚙️ Configuration & API

The application runs in **Mock Mode** by default, using a hardcoded list of curated video URLs. It attempts to fetch metadata via oEmbed or the YouTube Data API.

### Using Real YouTube Data

If you have a YouTube Data API Key, you can enable live metadata fetching:

1. Open your browser console.
2. Set the key in local storage:
```javascript
localStorage.setItem("YT_API_KEY", "YOUR_ACTUAL_KEY_HERE");

```


3. Refresh the page. The app will now fetch real titles and thumbnails from YouTube.

## 🎨 Design System

The app utilizes a centralized CSS variable system defined in `:root`:

| Variable | Color | Usage |
| --- | --- | --- |
| `--bg` | `#0b0d10` | Main background (Deep Black) |
| `--panel` | `#111419` | Cards and Modals |
| `--brand` | `#7c9cff` | Primary Brand Color (Soft Blue) |
| `--accent` | `#22d3ee` | Secondary Gradients (Cyan) |
| `--text` | `#e8eaed` | High contrast text |

## 🔮 Future Roadmap

This is currently a **Proof of Concept**. Future versions could include:

* Real OAuth integration with Google/YouTube.
* Persistent user preferences via LocalStorage or a backend database.
* "Read Later" or "Watch Later" queues.
* RSS feed integration for non-video content.

---

*Created for the "ZenView" Concept Mockup.*
