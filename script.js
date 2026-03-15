const container = document.getElementById("products");

let currentProducts = [];
let activeCategory = "all";
let activeSort = "";
let activeSearch = "";

const mobileCatalogBreakpoint = 900;
const STORE_STATE_KEY = "kids_room_store_state";

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

function saveStoreState() {
    const search = document.getElementById("search");
    const sortSelect = document.querySelector(".filters select");

    const state = {
        url: window.location.href,
        scrollY: window.scrollY || window.pageYOffset || 0,
        activeCategory,
        activeSort,
        activeSearch: search ? search.value.trim() : activeSearch,
        sortValue: sortSelect ? sortSelect.value : activeSort
    };

    sessionStorage.setItem(STORE_STATE_KEY, JSON.stringify(state));
}

function restoreStoreStateFromSession() {
    const raw = sessionStorage.getItem(STORE_STATE_KEY);
    if (!raw) return false;

    try {
        const state = JSON.parse(raw);

        activeCategory = state.activeCategory || "all";
        activeSort = state.activeSort || "";
        activeSearch = state.activeSearch || "";

        const search = document.getElementById("search");
        if (search) {
            search.value = activeSearch;
        }

        const sortSelect = document.querySelector(".filters select");
        if (sortSelect) {
            sortSelect.value = state.sortValue || activeSort || "";
        }

        return true;
    } catch (error) {
        console.error("Помилка відновлення стану магазину:", error);
        return false;
    }
}

function restoreStoreScroll() {
    const raw = sessionStorage.getItem(STORE_STATE_KEY);
    if (!raw) return;

    try {
        const state = JSON.parse(raw);
        const scrollY = Number(state.scrollY || 0);

        setTimeout(() => {
            window.scrollTo({
                top: scrollY,
                behavior: "auto"
            });
        }, 60);

        setTimeout(() => {
            window.scrollTo({
                top: scrollY,
                behavior: "auto"
            });
        }, 260);
    } catch (error) {
        console.error("Помилка відновлення прокрутки:", error);
    }
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

function escapeHtmlText(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function escapeHtmlAttr(value) {
    return escapeHtmlText(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function buildProductBadges(product) {
    const badges = [];

    if (product?.is_hit) {
        badges.push(`<span class="catalog-badge badge-hit">ХІТ</span>`);
    }

    if (product?.is_sale) {
        badges.push(`<span class="catalog-badge badge-sale">АКЦІЯ</span>`);
    }

    if (product?.is_new) {
        badges.push(`<span class="catalog-badge badge-new">НОВИНКА</span>`);
    }

    if (!badges.length) return "";

    return `<div class="catalog-badges">${badges.join("")}</div>`;
}

function buildProductPrice(product) {
    const currentPrice = Number(product?.price || 0);
    const oldPrice = Number(product?.old || 0);

    if (oldPrice > currentPrice) {
        return `
            <div class="price">
                <span class="old-price" id="old-${product.id}">${oldPrice} грн</span>
                <span>${currentPrice} грн</span>
            </div>
        `;
    }

    return `
        <div class="price">
            <span>${currentPrice} грн</span>
        </div>
    `;
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
        <div class="product product-card-with-badges" id="prod-${product.id}" onclick="openProduct('${escapeHtmlAttr(product.id)}')">
            <div class="product-image-wrap">
                ${buildProductBadges(product)}
                <img src="${getSafeProductImage(product)}" alt="${escapeHtmlAttr(product.name)}" onerror="this.onerror=null;this.src='${PRODUCT_PLACEHOLDER}'">
            </div>

            <h3>${escapeHtmlText(product.name)}</h3>

            ${buildProductPrice(product)}

            <div class="quantity" onclick="event.stopPropagation()">
                <button onclick="minus('${escapeHtmlAttr(product.id)}')">−</button>
                <input
                    id="qty-${escapeHtmlAttr(product.id)}"
                    type="number"
                    value="1"
                    min="1"
                    class="qty-input"
                >
                <button onclick="plus('${escapeHtmlAttr(product.id)}')">+</button>
            </div>

            <button class="add-btn" onclick="event.stopPropagation(); addToCart('${escapeHtmlAttr(product.id)}')">
                Додати в кошик
            </button>
        </div>
    `).join("");

    injectCatalogBadgeStyles();
}

function injectCatalogBadgeStyles() {
    if (document.getElementById("kids-room-catalog-badge-styles")) return;

    const style = document.createElement("style");
    style.id = "kids-room-catalog-badge-styles";
    style.textContent = `
    .product-card-with-badges .product-image-wrap{
        position:relative;
    }

    .product-card-with-badges .catalog-badges{
        position:absolute;
        top:10px;
        left:10px;
        display:flex;
        flex-wrap:wrap;
        gap:6px;
        z-index:2;
        pointer-events:none;
    }

    .product-card-with-badges .catalog-badge{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        padding:6px 10px;
        border-radius:999px;
        font-size:11px;
        font-weight:800;
        line-height:1;
        box-shadow:0 6px 14px rgba(0,0,0,0.08);
        background:#fff;
    }

    .product-card-with-badges .badge-hit{
        background:#fff1e6;
        color:#ca6200;
    }

    .product-card-with-badges .badge-sale{
        background:#fff0f0;
        color:#c64c4c;
    }

    .product-card-with-badges .badge-new{
        background:#edf8ff;
        color:#23628d;
    }
    `;
    document.head.appendChild(style);
}

function openProduct(id) {
    const product = findProductById(id);
    if (!product) return;

    saveStoreState();
    localStorage.setItem("selectedProduct", JSON.stringify(product));
    localStorage.setItem("kids_room_return_url", window.location.href);

    window.location.href = "product.html";
}

const searchEl = document.getElementById("search");
if (searchEl) {
    searchEl.addEventListener("input", event => {
        activeSearch = event.target.value.trim();
        applyFiltersAndRender();
        saveStoreState();
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
    saveStoreState();
    closeCatalogMenu();
}

function sortProducts(type) {
    activeSort = type || "";
    applyFiltersAndRender();
    saveStoreState();
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
    restoreStoreScroll();
}

window.addEventListener("products:ready", handleProductsReady);
window.addEventListener("products:updated", handleProductsReady);

window.addEventListener("storage", event => {
    if (event.key === "products") {
        handleProductsReady();
    }
});

if (typeof renderCart === "function") {
    renderCart();
}

window.addEventListener("resize", syncCatalogMenuOnResize);
document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeCatalogMenu();
});
syncCatalogMenuOnResize();
ensureSidebarCategoryMarkers();

restoreStoreStateFromSession();

if (typeof window.productsReady === "function" && window.productsReady()) {
    handleProductsReady();
}

window.addEventListener("beforeunload", saveStoreState);

window.filterCategory = filterCategory;
window.sortProducts = sortProducts;
window.plus = plus;
window.minus = minus;
window.openProduct = openProduct;
window.toggleCatalogMenu = toggleCatalogMenu;
window.closeCatalogMenu = closeCatalogMenu;