# hamilton-creations-framework
Repository for web design references

📚 Content Library Framework
A lightweight, file‑based content engine for static sites.

The Content Library Framework is a clean, modern, zero‑backend system for building searchable, categorized, Markdown‑powered content libraries. It’s ideal for:

documentation

personal knowledge bases

article collections

study notes

recipe libraries

spiritual writings

product catalogs

or any structured content set

Built with vanilla HTML, CSS, and JavaScript, it requires no build tools, no bundlers, and no server — just drop it into any static hosting environment.

🚀 Features
📁 File‑based content
All content is stored as Markdown files and referenced through a simple JSON dataset.

🧭 Smart navigation sidebar
Auto‑generated from your dataset

Collapsible categories

Active‑link highlighting

Smooth animations

“Collapse All” button included

🔍 Fuzzy search
Instant, forgiving search across titles, categories, and keywords.

🗂 Card‑based homepage
A responsive grid of content cards with pagination.

🌓 Dark mode
Built‑in theme toggle with persistent user preference.

📄 Markdown rendering
A custom Markdown engine supporting:

headings

paragraphs

lists

blockquotes

images

inline formatting

auto‑linked URLs

🔗 Related content
Automatic related‑item suggestions based on keyword overlap.

📱 Mobile‑friendly
Responsive layout with a slide‑in sidebar and overlay.

📦 Project Structure
Code
content-site-template/
│
├── index.html               # Homepage (card grid)
├── page.html                # Content viewer page
│
├── data/
│   └── content.json         # Your content dataset
│
├── content/
│   └── example.md           # Example Markdown file
│
├── scripts/
│   └── content.js           # Framework engine
│
└── styles/
    └── content.css          # Design system + layout

🧩 How It Works
1. Define your content in content.json
Each entry looks like:

json
{
  "title": "Sample Topic",
  "slug": "sample-topic",
  "category": "General",
  "keywords": ["sample", "demo"],
  "contentPath": "content/example.md"
}
2. Write your content in Markdown
Place .md files in the content/ folder.

3. The framework does the rest
Builds the sidebar

Builds the homepage cards

Loads Markdown dynamically

Renders it beautifully

Suggests related items

🎨 Customization
Design System
All colors, typography, spacing, shadows, and radii are defined in CSS variables at the top of content.css.

Change them once → the entire site updates.

Layout
The layout is controlled by:

.layout

.sidebar

.content-area

#contentCard

#contentDisplay

These can be restyled without touching the JS.

Dark Mode
Toggle is wired to:

html
<input type="checkbox" id="darkModeToggle">
And controlled entirely through CSS variables.

🛠 Adding New Content
Create a new Markdown file in /content/

Add a new entry to content.json

Refresh the browser

No build step.
No compilation.
No tooling.
Just content.

📱 Mobile Behavior
Sidebar becomes a slide‑in drawer

Overlay darkens the page

Active link auto‑scrolls into view

Layout collapses to a single column

Everything is handled automatically.

🧪 Browser Support
Chrome

Edge

Firefox

Safari

No dependencies.
No frameworks.
No polyfills required.

🗺 Roadmap (Optional)
Tag filtering UI

Search highlighting

Built‑in Markdown TOC

Theme presets

Plugin system

📄 License
MIT License — free to use, modify, and build upon.

