/* ============================================================
   GLOBAL STATE
============================================================ */
let writings = [];
let currentPage = 1;

/* ============================================================
   LOAD JSON DATA
============================================================ */
async function loadWritings() {
    try {
        const response = await fetch("data/writings.json");

        if (!response.ok) {
            throw new Error("Failed to load writings.json");
        }

        writings = await response.json();

        buildSidebar();

        // Homepage only
        if (document.body.classList.contains("homepage")) {

            // 🔤 Sort BEFORE the first render
            writings.sort((a, b) => a.title.localeCompare(b.title));

            buildCards(paginate(writings, currentPage));
            setupPaginationControls();
        }

        highlightActiveLink();

        // Writing page only
        loadMarkdownIfNeeded();
        renderRelatedWritings();

    } catch (err) {
        console.error("Error loading writings.json:", err);
    }
}


/* ============================================================
   BUILD SIDEBAR (with collapsible categories)
============================================================ */
function buildSidebar() {
    const nav = document.getElementById("sidebarNav");
    if (!nav) return;

    nav.innerHTML = "";

    const categories = {};

    // Group writings by category
    writings.forEach(item => {
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

        // Category header
        const header = document.createElement("h2");
        header.classList.add("nav-category");
        header.textContent = category;

        // List of items
        const list = document.createElement("ul");

        header.addEventListener("click", () => {
            const allLists = nav.querySelectorAll(".nav-section ul");
            const allHeaders = nav.querySelectorAll(".nav-category");

            // If this one is currently collapsed, we are about to open it
            const willOpen = list.classList.contains("collapsed");

            // Close all others
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

            // Toggle this one normally
            if (willOpen) {
                list.classList.remove("collapsed");
                header.classList.add("open");
            } else {
                list.classList.add("collapsed");
                header.classList.remove("open");
            }
            // Save state
            if (willOpen) {
                localStorage.setItem("openCategory", category);
            } else {
                localStorage.removeItem("openCategory");
            }

        });
        
        // Alphabetize items inside each category
        categories[category].sort((a, b) =>
            a.title.localeCompare(b.title)
        );

        // Build list items
        categories[category].forEach(item => {
            const li = document.createElement("li");
            const link = document.createElement("a");

            link.href = "writings.html?slug=" + item.slug;
            link.textContent = item.title;

            li.appendChild(link);
            list.appendChild(li);
        });

        section.appendChild(header);
        section.appendChild(list);
        nav.appendChild(section);
    });

    // Default collapsed state
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
    // Highlight active page
    const params = new URLSearchParams(window.location.search);
    const currentSlug = params.get("slug");

    if (currentSlug) {
        const links = nav.querySelectorAll("a");

        links.forEach(link => {
            const url = new URL(link.href, window.location.origin);
            const slug = url.searchParams.get("slug");

            if (slug === currentSlug) {
                link.classList.add("active");

                // Scroll active link into view
                link.scrollIntoView({
                    block: "center",
                    behavior: "smooth"
                });


                // Ensure its category is open
                const parentList = link.closest("ul");
                const parentHeader = parentList.previousElementSibling;

                parentList.classList.remove("collapsed");
                parentHeader.classList.add("open");
            }
        });
    }


}

// Auto-scroll active link when mobile sidebar opens
const sidebar = document.querySelector(".sidebar");
const toggleBtn = document.getElementById("sidebarToggle");

if (sidebar && toggleBtn) {
    toggleBtn.addEventListener("click", () => {
        const isOpening = !sidebar.classList.contains("open");

        if (isOpening) {
            setTimeout(() => {
                const activeLink = sidebar.querySelector("a.active");
                if (activeLink) {
                    activeLink.scrollIntoView({
                        block: "center",
                        behavior: "smooth"
                    });
                }
            }, 350); // matches your slide-in animation
        }
    });
}


/* ============================================================
   COLLAPSE / EXPAND ALL BUTTON
============================================================ */
function enableSidebarCollapsing() {
    const collapseBtn = document.getElementById("collapseAllBtn");
    if (!collapseBtn) return;

    collapseBtn.addEventListener("click", () => {
        const lists = document.querySelectorAll("#sidebarNav ul");
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
    const links = document.querySelectorAll(".sidebar a");
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
   SIDEBAR SEARCH (with fuzzy matching)
============================================================ */
function setupSidebarSearch() {
    const input = document.getElementById("searchInput");
    const nav = document.getElementById("sidebarNav");
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
function buildCards(filteredWritings) {
    const cardGrid = document.getElementById("cardGrid");
    if (!cardGrid) return;

    cardGrid.innerHTML = "";

    filteredWritings.sort((a, b) => a.title.localeCompare(b.title));

    filteredWritings.forEach(item => {
        const card = document.createElement("article");
        card.classList.add("card");

        card.innerHTML = `
        <a href="writings.html?slug=${item.slug}" class="card-link">
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

// AUTO-PAGINATION: determine cards per page based on viewport + grid width
function getCardsPerPage() {
    // const grid = document.querySelector(".card-grid");
    // if (!grid) return 12; // fallback
    return 12; // clean 4×3 grid without auto 

    const gridWidth = grid.offsetWidth;
    const cardWidth = 260; // matches CSS minmax(260px, 1fr)
    const cardsPerRow = Math.max(1, Math.floor(gridWidth / cardWidth));

    // Estimate vertical space (card height + gap)
    const approxRowHeight = 350;
    const rowsPerPage = Math.max(1, Math.floor(window.innerHeight / approxRowHeight));

    return cardsPerRow * rowsPerPage;
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

    const totalPages = Math.ceil(writings.length / getCardsPerPage());
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
   CARD SEARCH + FILTERING
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

    return writings.filter(item => {
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
   CATEGORY FILTER BUTTONS
============================================================ */
function setupCategoryButtons() {
    const buttons = document.querySelectorAll(".filter-buttons button");
    if (!buttons.length) return;

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            const category = btn.dataset.cat;
            const query = document.getElementById("cardSearch")?.value || "";
            currentPage = 1;
            const filtered = filterList(query, category);
            buildCards(paginate(filtered, currentPage));
            setupPaginationControls();
        });
    });
}

window.addEventListener("resize", () => {
    const query = document.getElementById("cardSearch")?.value || "";
    const filtered = filterList(query);
    buildCards(paginate(filtered, currentPage));
    setupPaginationControls();
});

/* ============================================================
   DARK MODE TOGGLE
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
    const container = document.getElementById("markdownContent");
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");
    if (!slug) return;

    const match = writings.find(w => w.slug === slug);
    if (!match || !match.mdUrl) return;

    try {
        const res = await fetch(`/gospeltopics/${match.mdUrl}`);
        if (!res.ok) {
            throw new Error("Markdown file not found: " + match.mdUrl);
        }

        const text = await res.text();
        container.innerHTML = markdownToHtml(text);
    } catch (err) {
        console.error("Error loading markdown:", err);
    }
}


/* ============================================================
   RICH MARKDOWN CONVERTER
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

        // Images ![alt](src)
        text = text.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">');

        // Auto-link bare URLs
        text = text.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank" rel="noopener">$1</a>'
        );

        // Scripture auto-linking (canonical URLs)
        text = text.replace(
            /\b([1-4]?\s?[A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d+):(\d+)(?:[-–](\d+))?/g,
            (match, book, chapter, v1, v2) => {
                const map = {
                    // New Testament
                    "Matthew": ["nt", "matt"],
                    "Mark": ["nt", "mark"],
                    "Luke": ["nt", "luke"],
                    "John": ["nt", "john"],
                    "Acts": ["nt", "acts"],
                    "Romans": ["nt", "rom"],
                    "1 Corinthians": ["nt", "1-cor"],
                    "2 Corinthians": ["nt", "2-cor"],
                    "Galatians": ["nt", "gal"],
                    "Ephesians": ["nt", "eph"],
                    "Philippians": ["nt", "philip"],
                    "Colossians": ["nt", "col"],
                    "1 Thessalonians": ["nt", "1-thes"],
                    "2 Thessalonians": ["nt", "2-thes"],
                    "1 Timothy": ["nt", "1-tim"],
                    "2 Timothy": ["nt", "2-tim"],
                    "Titus": ["nt", "titus"],
                    "Philemon": ["nt", "philem"],
                    "Hebrews": ["nt", "heb"],
                    "James": ["nt", "james"],
                    "1 Peter": ["nt", "1-pet"],
                    "2 Peter": ["nt", "2-pet"],
                    "1 John": ["nt", "1-jn"],
                    "2 John": ["nt", "2-jn"],
                    "3 John": ["nt", "3-jn"],
                    "Jude": ["nt", "jude"],
                    "Revelation": ["nt", "rev"],

                    // Book of Mormon
                    "1 Nephi": ["bofm", "1-ne"],
                    "2 Nephi": ["bofm", "2-ne"],
                    "Jacob": ["bofm", "jacob"],
                    "Enos": ["bofm", "enos"],
                    "Jarom": ["bofm", "jarom"],
                    "Omni": ["bofm", "omni"],
                    "Words of Mormon": ["bofm", "w-of-m"],
                    "Mosiah": ["bofm", "mosiah"],
                    "Alma": ["bofm", "alma"],
                    "Helaman": ["bofm", "hel"],
                    "3 Nephi": ["bofm", "3-ne"],
                    "4 Nephi": ["bofm", "4-ne"],
                    "Mormon": ["bofm", "morm"],
                    "Ether": ["bofm", "ether"],
                    "Moroni": ["bofm", "moro"],

                    // Doctrine & Covenants
                    "D&C": ["dc-testament", "dc"],

                    // Pearl of Great Price
                    "Moses": ["pgp", "moses"],
                    "Abraham": ["pgp", "abr"],
                    "Joseph Smith—Matthew": ["pgp", "js-m"],
                    "Joseph Smith—History": ["pgp", "js-h"],
                    "Articles of Faith": ["pgp", "a-of-f"]
                };

                const key = book.trim();
                if (!map[key]) return match;

                const [vol, slug] = map[key];

                const verseRange = v2 ? `p${v1}-p${v2}` : `p${v1}`;
                const hash = `#p${v1}`;

                const url =
                    `https://www.churchofjesuschrist.org/study/scriptures/${vol}/${slug}/${chapter}` +
                    `?lang=eng&id=${verseRange}${hash}`;

                return `<a href="${url}" target="_blank" rel="noopener">${match}</a>`;
            }
        );

        // Bold (**text**)
        text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

        // Italics (*text*)
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
   RELATED WRITINGS
============================================================ */
function renderRelatedWritings() {
    const container = document.getElementById("relatedWritings");
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");
    if (!slug) return;

    const currentItem = writings.find(w => w.slug === slug);
    if (!currentItem) return;

    const related = writings
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
        container.innerHTML = "<p>No related writings found.</p>";
        return;
    }

    const list = document.createElement("ul");
    related.forEach(w => {
        const li = document.createElement("li");
        const link = document.createElement("a");
        link.href = "writings.html?slug=" + w.slug;
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
    loadWritings();
    setupSidebarSearch();
    setupCardSearch();
    setupCategoryButtons();
    setupDarkMode();
    enableSidebarCollapsing();
});

document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.querySelector(".sidebar");
    const toggle = document.getElementById("sidebarToggle");

    // Create overlay
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
    });

    overlay.addEventListener("click", closeSidebar);
});