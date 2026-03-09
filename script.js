const container = document.getElementById("products");

let currentProducts = [];
let activeCategory = "all";
let activeSort = "";
let activeSearch = "";

const mobileCatalogBreakpoint = 900;

function isMobileCatalogMode() {
    return window.innerWidth <= mobileCatalogBreakpoint;
}

function toggleCatalogMenu() {
    if (!isMobileCatalogMode()) return;

    const sidebar = document.getElementById("catalog-sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (!sidebar || !overlay) return;

    const willOpen = !sidebar.classList.contains("open");
    sidebar.classList.toggle("open", willOpen);
    overlay.classList.toggle("active", willOpen);
    document.body.classList.toggle("catalog-menu-open", willOpen);
}

function closeCatalogMenu() {
    const sidebar = document.getElementById("catalog-sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (!sidebar || !overlay) return;

    sidebar.classList.remove("open");
    overlay.classList.remove("active");
    document.body.classList.remove("catalog-menu-open");
}

function syncCatalogMenuOnResize() {
    if (!isMobileCatalogMode()) {
        closeCatalogMenu();
    }
}

function getBaseProducts() {
    return Array.isArray(window.products) ? [...window.products] : [];
}

function updateActiveCategoryUI() {
    const items = document.querySelectorAll(".sidebar li");
    items.forEach(item => item.classList.remove("active", "selected"));

    const activeItem = document.querySelector(`.sidebar li[data-category="${activeCategory}"]`);
    if (activeItem) {
        activeItem.classList.add("active", "selected");
    }
}

function ensureSidebarCategoryMarkers() {
    const items = document.querySelectorAll(".sidebar li");
    items.forEach(item => {
        if (item.dataset.category) return;

        const onclickValue = item.getAttribute("onclick") || "";
        const match = onclickValue.match(/filterCategory\('([^']+)'\)/);
        if (match) {
            item.dataset.category = match[1];
        }
    });

    updateActiveCategoryUI();
}

function applyFiltersAndRender() {
    let list = getBaseProducts();

    if (activeCategory !== "all") {
        list = list.filter(product => product.category === activeCategory);
    }

    if (activeSearch) {
        const search = activeSearch.toLowerCase();
        list = list.filter(product => String(product.name || "").toLowerCase().includes(search));
    }

    if (activeSort === "cheap") {
        list.sort((a, b) => a.price - b.price);
    }

    if (activeSort === "expensive") {
        list.sort((a, b) => b.price - a.price);
    }

    if (activeSort === "name") {
        list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "uk"));
    }

    currentProducts = list;
    renderProducts(currentProducts);
    updateActiveCategoryUI();
}

function renderProducts(list) {
    if (!container) return;

    container.innerHTML = "";

    if (!Array.isArray(list) || list.length === 0) {
        container.innerHTML = `
        <div style="grid-column:1/-1; background:#fffdf9; padding:24px; border-radius:14px; box-shadow:0 6px 18px rgba(0,0,0,0.08); text-align:center;">
            Товари поки що відсутні
        </div>
        `;
        return;
    }

    container.innerHTML = list.map(product => `
        <div class="product" id="prod-${product.id}" onclick="openProduct('${product.id}')">
            <img src="${getSafeProductImage(product)}" alt="${escapeHtmlAttr(product.name)}" onerror="this.onerror=null;this.src='${PRODUCT_PLACEHOLDER}'">
            <h3>${escapeHtmlText(product.name)}</h3>
            <div class="price">
                <span class="old-price" id="old-${product.id}">${product.old} грн</span>
                <span>${product.price} грн</span>
            </div>
            <div class="quantity" onclick="event.stopPropagation()">
                <button onclick="minus('${product.id}')">−</button>
                <input
                    id="qty-${product.id}"
                    type="number"
                    value="1"
                    min="1"
                    class="qty-input"
                >
                <button onclick="plus('${product.id}')">+</button>
            </div>
            <button class="add-btn" onclick="event.stopPropagation(); addToCart('${product.id}')">
                Додати в кошик
            </button>
        </div>
    `).join("");
}

function escapeHtmlText(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function escapeHtmlAttr(value) {
    return escapeHtmlText(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function openProduct(id) {
    const product = findProductById(id);
    if (!product) return;

    localStorage.setItem("selectedProduct", JSON.stringify(product));
    localStorage.setItem("kids_room_return_url", window.location.href);
    window.open("product.html", "_blank");
}

const searchEl = document.getElementById("search");
if (searchEl) {
    searchEl.addEventListener("input", event => {
        activeSearch = event.target.value.trim();
        applyFiltersAndRender();
    });
}

function filterCategory(category) {
    activeCategory = category || "all";

    const search = document.getElementById("search");
    if (search) {
        search.value = "";
    }
    activeSearch = "";

    applyFiltersAndRender();
    closeCatalogMenu();
}

function sortProducts(type) {
    activeSort = type || "";
    applyFiltersAndRender();
}

let lastScroll = 0;
const header = document.querySelector("header");

window.addEventListener("scroll", () => {
    const current = window.pageYOffset;

    if (header) {
        if (current > lastScroll && current > 100) {
            header.classList.add("hide");
        } else {
            header.classList.remove("hide");
        }
    }

    lastScroll = current;
});

function plus(id) {
    const el = document.getElementById("qty-" + id);
    if (!el) return;

    const value = parseInt(el.value || "1", 10);
    el.value = Number.isNaN(value) || value < 1 ? 1 : value + 1;
}

function minus(id) {
    const el = document.getElementById("qty-" + id);
    if (!el) return;

    const value = parseInt(el.value || "1", 10);
    if (Number.isNaN(value) || value <= 1) {
        el.value = 1;
        return;
    }

    el.value = value - 1;
}

function handleProductsReady() {
    ensureSidebarCategoryMarkers();
    applyFiltersAndRender();
}

window.addEventListener("products:ready", handleProductsReady);
window.addEventListener("products:updated", handleProductsReady);

window.addEventListener("storage", event => {
    if (event.key === "products") {
        handleProductsReady();
    }
});

renderCart();

window.addEventListener("resize", syncCatalogMenuOnResize);
document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeCatalogMenu();
});
syncCatalogMenuOnResize();
ensureSidebarCategoryMarkers();

if (typeof window.productsReady === "function" && window.productsReady()) {
    handleProductsReady();
}