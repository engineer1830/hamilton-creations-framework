/* ============================================================
   GLOBAL STATE
============================================================ */
let items = [];
let currentPage = 1;

/* ============================================================
   LOAD JSON DATA
============================================================ */
async function loadContent() {
    try {
        const response = await fetch("data/content.json");

        if (!response.ok) {
            throw new Error("Failed to load content.json");
        }

        items = await response.json();

        buildNavSidebar();

        // Homepage only
        if (document.body.classList.contains("homepage")) {
            items.sort((a, b) => a.title.localeCompare(b.title));
            buildCards(paginate(items, currentPage));
            setupPaginationControls();
        }

        highlightActiveLink();
        loadMarkdownIfNeeded();
        renderRelatedItems();

    } catch (err) {
        console.error("Error loading content.json:", err);
    }
}

/* ============================================================
   BUILD SIDEBAR (collapsible categories)
============================================================ */
function buildNavSidebar() {
    const nav = document.getElementById("navSidebar");
    if (!nav) return;

    nav.innerHTML = "";

    const categories = {};

    // Group items by category
    items.forEach(item => {
        if (!categories[item.category]) {
            categories[item.category] = [];
        }
        categories[item.category].push(item);
    });

    // Alphabetize category names
    const sortedCategories = Object.keys(categories).sort((a, b) =>
        a.localeCompare(b)
    );

    sortedCategories.forEach(category => {
        const section = document.createElement("section");
        section.classList.add("nav-section");

        const header = document.createElement("h2");
        header.classList.add("nav-category");
        header.textContent = category;

        const list = document.createElement("ul");

        header.addEventListener("click", () => {
            const allLists = nav.querySelectorAll(".nav-section ul");
            const allHeaders = nav.querySelectorAll(".nav-category");

            const willOpen = list.classList.contains("collapsed");

            allLists.forEach(otherList => {
                if (otherList !== list) {
                    otherList.classList.add("collapsed");
                }
            });

            allHeaders.forEach(otherHeader => {
                if (otherHeader !== header) {
                    otherHeader.classList.remove("open");
                }
            });

            if (willOpen) {
                list.classList.remove("collapsed");
                header.classList.add("open");
                localStorage.setItem("openCategory", category);
            } else {
                list.classList.add("collapsed");
                header.classList.remove("open");
                localStorage.removeItem("openCategory");
            }
        });

        // Alphabetize items inside category
        categories[category].sort((a, b) =>
            a.title.localeCompare(b.title)
        );

        categories[category].forEach(item => {
            const li = document.createElement("li");
            const link = document.createElement("a");

            link.href = "page.html?slug=" + item.slug;
            link.textContent = item.title;

            li.appendChild(link);
            list.appendChild(li);
        });

        section.appendChild(header);
        section.appendChild(list);
        nav.appendChild(section);
    });

    // Default collapsed
    const lists = nav.querySelectorAll("ul");
    lists.forEach(list => list.classList.add("collapsed"));

    // Restore saved category
    const saved = localStorage.getItem("openCategory");
    if (saved) {
        const sections = nav.querySelectorAll(".nav-section");

        sections.forEach(section => {
            const header = section.querySelector(".nav-category");
            const list = section.querySelector("ul");

            if (header.textContent === saved) {
                list.classList.remove("collapsed");
                header.classList.add("open");
            }
        });
    }

    // Highlight active link
    const params = new URLSearchParams(window.location.search);
    const currentSlug = params.get("slug");

    if (currentSlug) {
        const links = nav.querySelectorAll("a");

        links.forEach(link => {
            const url = new URL(link.href, window.location.origin);
            const slug = url.searchParams.get("slug");

            if (slug === currentSlug) {
                link.classList.add("active");

                link.scrollIntoView({
                    block: "center",
                    behavior: "smooth"
                });

                const parentList = link.closest("ul");
                const parentHeader = parentList.previousElementSibling;

                parentList.classList.remove("collapsed");
                parentHeader.classList.add("open");
            }
        });
    }
}

/* ============================================================
   COLLAPSE / EXPAND ALL BUTTON
============================================================ */
function enableSidebarCollapsing() {
    const collapseBtn = document.getElementById("collapseAllBtn");
    if (!collapseBtn) return;

    collapseBtn.addEventListener("click", () => {
        const lists = document.querySelectorAll("#navSidebar ul");
        const allCollapsed = [...lists].every(list =>
            list.classList.contains("collapsed")
        );

        lists.forEach(list => {
            if (allCollapsed) {
                list.classList.remove("collapsed");
            } else {
                list.classList.add("collapsed");
            }
        });

        collapseBtn.textContent = allCollapsed
            ? "Collapse All"
            : "Expand All";
    });
}

/* ============================================================
   ACTIVE LINK HIGHLIGHTING
============================================================ */
function highlightActiveLink() {
    const links = document.querySelectorAll("#navSidebar a");
    const params = new URLSearchParams(window.location.search);
    const currentSlug = params.get("slug");

    links.forEach(link => {
        const url = new URL(link.href);
        const linkSlug = url.searchParams.get("slug");

        if (currentSlug && linkSlug === currentSlug) {
            link.classList.add("active");

            const parentList = link.closest("ul");
            if (parentList) {
                parentList.classList.remove("collapsed");
            }
        }
    });
}

/* ============================================================
   SIDEBAR SEARCH (fuzzy)
============================================================ */
function setupSidebarSearch() {
    const input = document.getElementById("searchInput");
    const nav = document.getElementById("navSidebar");
    if (!input || !nav) return;

    input.addEventListener("input", () => {
        const query = input.value.toLowerCase();
        const links = nav.querySelectorAll("a");

        links.forEach(link => {
            const text = link.textContent.toLowerCase();
            const score = fuzzyScore(text, query);
            link.parentElement.style.display = score > 0 ? "block" : "none";
        });
    });
}

/* ============================================================
   FUZZY MATCHING
============================================================ */
function fuzzyScore(text, query) {
    if (!query) return 1;
    let ti = 0;
    let qi = 0;
    let score = 0;

    while (ti < text.length && qi < query.length) {
        if (text[ti] === query[qi]) {
            score += 1;
            qi++;
        }
        ti++;
    }

    return qi === query.length ? score : 0;
}

/* ============================================================
   BUILD HOMEPAGE CARDS
============================================================ */
function buildCards(filteredItems) {
    const cardGrid = document.getElementById("cardContainer");
    if (!cardGrid) return;

    cardGrid.innerHTML = "";

    filteredItems.sort((a, b) => a.title.localeCompare(b.title));

    filteredItems.forEach(item => {
        const card = document.createElement("article");
        card.classList.add("card");

        card.innerHTML = `
        <a href="page.html?slug=${item.slug}" class="card-link">
            <h3>${item.title}</h3>
            <p class="category">${item.category}</p>
            <p class="keywords">${item.keywords.join(", ")}</p>
            <span class="read-link">Read →</span>
        </a>
        `;

        cardGrid.appendChild(card);
    });
}

/* ============================================================
   PAGINATION
============================================================ */
function getCardsPerPage() {
    return 12; // clean 4×3 grid
}

function paginate(list, page) {
    const cardsPerPage = getCardsPerPage();
    const start = (page - 1) * cardsPerPage;
    return list.slice(start, start + cardsPerPage);
}

function setupPaginationControls() {
    const container = document.getElementById("pagination");
    if (!container) return;

    container.innerHTML = "";

    const totalPages = Math.ceil(items.length / getCardsPerPage());
    if (totalPages <= 1) return;

    for (let p = 1; p <= totalPages; p++) {
        const btn = document.createElement("button");
        btn.textContent = p;
        if (p === currentPage) btn.classList.add("active");

        btn.addEventListener("click", () => {
            currentPage = p;
            const query = document.getElementById("cardSearch")?.value || "";
            const filtered = filterList(query);

            filtered.sort((a, b) => a.title.localeCompare(b.title));

            buildCards(paginate(filtered, currentPage));
            setupPaginationControls();
        });

        container.appendChild(btn);
    }
}

/* ============================================================
   CARD SEARCH
============================================================ */
function setupCardSearch() {
    const input = document.getElementById("cardSearch");
    if (!input) return;

    input.addEventListener("input", () => {
        currentPage = 1;
        const filtered = filterList(input.value);
        buildCards(paginate(filtered, currentPage));
        setupPaginationControls();
    });
}

function filterList(query = "", category = "all") {
    query = query.toLowerCase();

    return items.filter(item => {
        const haystack = [
            item.title.toLowerCase(),
            item.category.toLowerCase(),
            item.keywords.join(" ").toLowerCase()
        ].join(" ");

        const matchesText = fuzzyScore(haystack, query) > 0 || !query;
        const matchesCategory = category === "all" || item.category === category;

        return matchesText && matchesCategory;
    });
}

/* ============================================================
   DARK MODE
============================================================ */
function setupDarkMode() {
    const toggle = document.getElementById("darkModeToggle");
    if (!toggle) return;

    const saved = localStorage.getItem("darkMode") === "true";
    if (saved) {
        document.body.classList.add("dark");
        toggle.checked = true;
    }

    toggle.addEventListener("change", () => {
        const enabled = toggle.checked;
        document.body.classList.toggle("dark", enabled);
        localStorage.setItem("darkMode", String(enabled));
    });
}

/* ============================================================
   MARKDOWN LOADER
============================================================ */
async function loadMarkdownIfNeeded() {
    const container = document.getElementById("contentDisplay");
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");
    if (!slug) return;

    const match = items.find(w => w.slug === slug);
    if (!match || !match.contentPath) return;

    try {
        const res = await fetch(match.contentPath);
        if (!res.ok) {
            throw new Error("Markdown file not found: " + match.contentPath);
        }

        const text = await res.text();
        container.innerHTML = markdownToHtml(text);

        const titleEl = document.getElementById("pageTitle");
        if (titleEl) titleEl.textContent = match.title;

    } catch (err) {
        console.error("Error loading markdown:", err);
    }
}

/* ============================================================
   MARKDOWN CONVERTER (generic)
============================================================ */
function markdownToHtml(md) {
    const lines = md.split("\n");
    const html = [];
    let inList = false;
    let listType = null;

    function closeListIfOpen() {
        if (inList && listType) {
            html.push(`</${listType}>`);
            inList = false;
            listType = null;
        }
    }

    function applyInlineFormatting(text) {
        // Images
        text = text.replace(/!

            \[(.*?) \]

            \((.*?) \) / g, '<img src="$2" alt="$1">');

        // Auto-link URLs
        text = text.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank" rel="noopener">$1</a>'
        );

        // Bold
        text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

        // Italics
        text = text.replace(/(^|[\s(])\*(?!\*)([^*]+)\*(?=[\s).]|$)/g, "$1<em>$2</em>");

        return text;
    }

    for (let rawLine of lines) {
        let line = rawLine.replace(/\r$/, "");

        if (line.trim() === "") {
            closeListIfOpen();
            continue;
        }

        const h3 = line.match(/^###\s+(.*)/);
        const h2 = line.match(/^##\s+(.*)/);
        const h1 = line.match(/^#\s+(.*)/);

        if (h3) {
            closeListIfOpen();
            html.push(`<h3>${applyInlineFormatting(h3[1])}</h3>`);
            continue;
        }
        if (h2) {
            closeListIfOpen();
            html.push(`<h2>${applyInlineFormatting(h2[1])}</h2>`);
            continue;
        }
        if (h1) {
            closeListIfOpen();
            html.push(`<h1>${applyInlineFormatting(h1[1])}</h1>`);
            continue;
        }

        const bq = line.match(/^>\s?(.*)/);
        if (bq) {
            closeListIfOpen();
            html.push(`<blockquote>${applyInlineFormatting(bq[1])}</blockquote>`);
            continue;
        }

        const ol = line.match(/^\d+\.\s+(.*)/);
        if (ol) {
            if (!inList || listType !== "ol") {
                closeListIfOpen();
                html.push("<ol>");
                inList = true;
                listType = "ol";
            }
            html.push(`<li>${applyInlineFormatting(ol[1])}</li>`);
            continue;
        }

        const ul = line.match(/^[-*]\s+(.*)/);
        if (ul) {
            if (!inList || listType !== "ul") {
                closeListIfOpen();
                html.push("<ul>");
                inList = true;
                listType = "ul";
            }
            html.push(`<li>${applyInlineFormatting(ul[1])}</li>`);
            continue;
        }

        closeListIfOpen();
        html.push(`<p>${applyInlineFormatting(line)}</p>`);
    }

    if (inList && listType) {
        html.push(`</${listType}>`);
    }

    return html.join("\n");
}

/* ============================================================
   RELATED ITEMS
============================================================ */
function renderRelatedItems() {
    const container = document.getElementById("relatedItems");
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");
    if (!slug) return;

    const currentItem = items.find(w => w.slug === slug);
    if (!currentItem) return;

    const related = items
        .filter(w => w !== currentItem)
        .map(w => {
            const overlap = w.keywords.filter(k => currentItem.keywords.includes(k));
            return { item: w, score: overlap.length };
        })
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(x => x.item);

    if (!related.length) {
        container.innerHTML = "<p>No related items found.</p>";
        return;
    }

    const list = document.createElement("ul");
    related.forEach(w => {
        const li = document.createElement("li");
        const link = document.createElement("a");
        link.href = "page.html?slug=" + w.slug;
        link.textContent = w.title;
        li.appendChild(link);
        list.appendChild(li);
    });

    container.innerHTML = "";
    container.appendChild(list);
}

/* ============================================================
   INITIALIZE EVERYTHING
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
    loadContent();
    setupSidebarSearch();
    setupCardSearch();
    setupDarkMode();
    enableSidebarCollapsing();
});

/* ============================================================
   MOBILE SIDEBAR TOGGLE
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.querySelector(".sidebar");
    const toggle = document.getElementById("sidebarToggle");

    const overlay = document.createElement("div");
    overlay.id = "sidebarOverlay";
    document.body.appendChild(overlay);

    function closeSidebar() {
        sidebar.classList.remove("open");
        overlay.classList.remove("visible");
    }

    toggle.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        overlay.classList.toggle("visible");

        if (sidebar.classList.contains("open")) {
            setTimeout(() => {
                const activeLink = sidebar.querySelector("a.active");
                if (activeLink) {
                    activeLink.scrollIntoView({
                        block: "center",
                        behavior: "smooth"
                    });
                }
            }, 350);
        }
    });

    overlay.addEventListener("click", closeSidebar);
});
