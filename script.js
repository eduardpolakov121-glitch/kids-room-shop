const container = document.getElementById("products");

let currentProducts = [];
let activeCategory = "all";
let activeSort = "";
let activeSearch = "";

const mobileCatalogBreakpoint = 900;

const STORE_STATE_KEY = "kids_room_store_state";
const FAVORITES_KEY = "kids_room_favorites";
const RECENTLY_VIEWED_KEY = "kids_room_recently_viewed";

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

/* ===== FAVORITES ===== */

function getFavorites() {
    try {
        const raw = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
        return Array.isArray(raw) ? raw.map(String) : [];
    } catch {
        return [];
    }
}

function saveFavorites(list) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.isArray(list) ? list : []));
    window.dispatchEvent(new CustomEvent("favorites:updated"));
}

function isFavorite(id) {
    return getFavorites().includes(String(id));
}

function toggleFavorite(id) {
    const value = String(id);
    const favorites = getFavorites();
    const exists = favorites.includes(value);

    const next = exists
        ? favorites.filter(item => item !== value)
        : [value, ...favorites].slice(0, 100);

    saveFavorites(next);
    applyFiltersAndRender();

    if (typeof renderHomeFavoritesSection === "function") {
        renderHomeFavoritesSection();
    }
}

/* ===== RECENTLY VIEWED ===== */

function getRecentlyViewedIds() {
    try {
        const raw = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]");
        return Array.isArray(raw) ? raw.map(String) : [];
    } catch {
        return [];
    }
}

function addRecentlyViewed(id) {
    const value = String(id);
    const current = getRecentlyViewedIds().filter(item => item !== value);
    const next = [value, ...current].slice(0, 16);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("recently:viewed"));
}

/* ===== STORE STATE ===== */

function saveStoreState() {
    const search = document.getElementById("search");
    const sortSelect = document.querySelector(".filters select");

    const state = {
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
        }, 80);

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

/* ===== SEARCH FOCUS MODE ===== */

function getSearchFocusElements() {
    return Array.from(document.querySelectorAll(
        ".hero-selling, .banner, .home-trust-strip, .cta-banner, .site-footer, .social, .section-wrap, .home-dynamic-block"
    ));
}

function updateSearchFocusMode() {
    const hasSearch = activeSearch.trim().length > 0;
    const elements = getSearchFocusElements();
    const productsBlock = document.querySelector(".container");
    const searchInput = document.getElementById("search");

    elements.forEach(element => {
        if (!element) return;

        const hasProductsInside = element.contains(container);
        if (hasProductsInside) return;

        if (hasSearch) {
            element.style.display = "none";
        } else {
            element.style.display = "";
        }
    });

    if (productsBlock) {
        if (hasSearch) {
            productsBlock.style.marginTop = "96px";
        } else {
            productsBlock.style.marginTop = "20px";
        }
    }

    if (searchInput && hasSearch) {
        setTimeout(() => {
            searchInput.scrollIntoView({
                block: "nearest",
                behavior: "smooth"
            });
        }, 60);
    }
}

/* ===== UI CATEGORY COUNTS ===== */

function updateActiveCategoryUI() {
    const items = document.querySelectorAll(".sidebar li");
    const products = getBaseProducts();

    items.forEach(item => {
        item.classList.remove("active", "selected");

        const categoryId = item.dataset.category || "all";
        const baseLabel = item.dataset.baseLabel || item.textContent.trim();
        item.dataset.baseLabel = baseLabel;

        let count = 0;
        if (categoryId === "all") {
            count = products.length;
        } else {
            count = products.filter(product => product.category === categoryId).length;
        }

        item.innerHTML = `${baseLabel} <span class="sidebar-count">${count}</span>`;
    });

    const activeItem = document.querySelector(`.sidebar li[data-category="${activeCategory}"]`);
    if (activeItem) {
        activeItem.classList.add("active", "selected");
    }
}

function ensureSidebarCategoryMarkers() {
    const items = document.querySelectorAll(".sidebar li");
    items.forEach(item => {
        if (!item.dataset.baseLabel) {
            item.dataset.baseLabel = item.textContent.trim();
        }

        if (item.dataset.category) return;

        const onclickValue = item.getAttribute("onclick") || "";
        const match = onclickValue.match(/filterCategory\('([^']+)'\)/);
        if (match) {
            item.dataset.category = match[1];
        }
    });

    updateActiveCategoryUI();
}

/* ===== HELPERS ===== */

function escapeHtmlText(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function escapeHtmlAttr(value) {
    return escapeHtmlText(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function getStockClass(product) {
    const status = String(product?.stock_status || "in_stock");
    if (status === "low_stock") return "stock-low";
    if (status === "out_of_stock") return "stock-out";
    return "stock-in";
}

function matchProductBySearch(product, search) {
    const text = [
        product?.name || "",
        product?.description || "",
        typeof getCategoryName === "function" ? getCategoryName(product?.category) : "",
        Array.isArray(product?.tags) ? product.tags.join(" ") : ""
    ].join(" ").toLowerCase();

    return text.includes(search);
}

function getSmartFilterState() {
    return {
        hit: !!document.getElementById("smart-hit")?.checked,
        sale: !!document.getElementById("smart-sale")?.checked,
        newest: !!document.getElementById("smart-new")?.checked,
        available: !!document.getElementById("smart-available")?.checked,
        favorites: !!document.getElementById("smart-favorites")?.checked
    };
}

/* ===== BADGES ===== */

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

    const stockName = typeof getStockStatusName === "function"
        ? getStockStatusName(product?.stock_status)
        : "Є в наявності";

    badges.push(`<span class="catalog-badge ${getStockClass(product)}">${escapeHtmlText(stockName)}</span>`);

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

/* ===== FILTER + RENDER ===== */

function applyFiltersAndRender() {
    let list = getBaseProducts();
    const smart = getSmartFilterState();
    const favorites = getFavorites();

    if (activeCategory !== "all") {
        list = list.filter(product => product.category === activeCategory);
    }

    if (activeSearch) {
        const search = activeSearch.toLowerCase();
        list = list.filter(product => matchProductBySearch(product, search));
    }

    if (smart.hit) {
        list = list.filter(product => product.is_hit);
    }

    if (smart.sale) {
        list = list.filter(product => product.is_sale);
    }

    if (smart.newest) {
        list = list.filter(product => product.is_new);
    }

    if (smart.available) {
        list = list.filter(product => String(product.stock_status || "in_stock") !== "out_of_stock");
    }

    if (smart.favorites) {
        list = list.filter(product => favorites.includes(String(product.id)));
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
    updateProductResultsCount();
    updateSearchFocusMode();
}

function updateProductResultsCount() {
    const el = document.getElementById("products-results-count");
    if (!el) return;
    el.textContent = `Знайдено товарів: ${currentProducts.length}`;
}

function renderProducts(list) {
    if (!container) return;

    container.innerHTML = "";

    if (!Array.isArray(list) || list.length === 0) {
        container.innerHTML = `
        <div class="catalog-empty-state">
            <div class="catalog-empty-icon">🧸</div>
            <h3>Нічого не знайдено</h3>
            <p>Спробуй змінити пошук, прибрати частину фільтрів або повернутись до всіх товарів.</p>
            <button class="catalog-empty-btn" type="button" onclick="resetSmartFiltersAndShowAll()">Показати всі товари</button>
        </div>
        `;
        return;
    }

    container.innerHTML = list.map(product => {
        const favoriteClass = isFavorite(product.id) ? "is-favorite" : "";
        const stockStatus = String(product?.stock_status || "in_stock");
        const isOut = stockStatus === "out_of_stock";

        return `
        <div class="product product-card-with-badges" id="prod-${product.id}" onclick="openProduct('${escapeHtmlAttr(product.id)}')">
            <div class="product-image-wrap">
                ${buildProductBadges(product)}

                <button
                    class="catalog-favorite-btn ${favoriteClass}"
                    type="button"
                    onclick="event.stopPropagation(); toggleFavorite('${escapeHtmlAttr(product.id)}')"
                    aria-label="Додати в обране"
                    title="Обране"
                >❤</button>

                <img src="${getSafeProductImage(product)}" alt="${escapeHtmlAttr(product.name)}" onerror="this.onerror=null;this.src='${PRODUCT_PLACEHOLDER}'">
            </div>

            <h3>${escapeHtmlText(product.name)}</h3>

            <div class="catalog-card-desc">${escapeHtmlText((product.description || "").slice(0, 84))}${(product.description || "").length > 84 ? "…" : ""}</div>

            ${buildProductPrice(product)}

            <div class="quantity" onclick="event.stopPropagation()">
                <button onclick="minus('${escapeHtmlAttr(product.id)}')">−</button>
                <input
                    id="qty-${escapeHtmlAttr(product.id)}"
                    type="number"
                    value="1"
                    min="1"
                    class="qty-input"
                    ${isOut ? "disabled" : ""}
                >
                <button onclick="plus('${escapeHtmlAttr(product.id)}')">+</button>
            </div>

            <div class="catalog-card-actions" onclick="event.stopPropagation()">
                <button class="catalog-secondary-btn" type="button" onclick="openQuickView('${escapeHtmlAttr(product.id)}')">
                    Швидкий перегляд
                </button>
                <button class="add-btn" ${isOut ? "disabled" : ""} onclick="event.stopPropagation(); addToCart('${escapeHtmlAttr(product.id)}')">
                    ${isOut ? "Немає в наявності" : "Додати в кошик"}
                </button>
            </div>
        </div>
        `;
    }).join("");

    injectCatalogEnhancementStyles();
}

/* ===== STYLES ===== */

function injectCatalogEnhancementStyles() {
    if (document.getElementById("kids-room-catalog-enhancement-styles")) return;

    const style = document.createElement("style");
    style.id = "kids-room-catalog-enhancement-styles";
    style.textContent = `
    .sidebar-count{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        min-width:24px;
        height:24px;
        padding:0 8px;
        border-radius:999px;
        background:#fff;
        color:#ff6600;
        font-size:12px;
        font-weight:800;
        margin-left:8px;
    }

    .smart-filters{
        padding:0 20px 6px;
        display:flex;
        flex-wrap:wrap;
        gap:10px;
        align-items:center;
    }

    .smart-chip{
        display:inline-flex;
        align-items:center;
        gap:8px;
        background:#fff;
        border:1px solid #ece7df;
        border-radius:999px;
        padding:10px 14px;
        font-size:14px;
        font-weight:700;
        color:#243041;
        box-shadow:0 8px 18px rgba(0,0,0,0.04);
        cursor:pointer;
    }

    .smart-chip input{
        width:auto;
        margin:0;
        accent-color:#ff6600;
    }

    .products-top-meta{
        padding:0 20px 4px;
        color:#6f7b8c;
        font-size:14px;
        font-weight:700;
    }

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
        max-width:72%;
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

    .product-card-with-badges .stock-in{
        background:#ecfdf3;
        color:#15803d;
    }

    .product-card-with-badges .stock-low{
        background:#fff7ed;
        color:#c2410c;
    }

    .product-card-with-badges .stock-out{
        background:#f3f4f6;
        color:#6b7280;
    }

    .catalog-favorite-btn{
        position:absolute;
        right:10px;
        top:10px;
        width:38px;
        height:38px;
        border:none;
        border-radius:50%;
        background:rgba(255,255,255,0.95);
        color:#9ca3af;
        cursor:pointer;
        z-index:3;
        font-size:16px;
        font-weight:900;
        box-shadow:0 8px 16px rgba(0,0,0,0.08);
    }

    .catalog-favorite-btn.is-favorite{
        color:#ef4444;
        background:#fff0f0;
    }

    .catalog-card-desc{
        color:#6f7b8c;
        font-size:14px;
        line-height:1.5;
        min-height:42px;
        margin-bottom:6px;
    }

    .catalog-card-actions{
        display:flex;
        flex-direction:column;
        gap:8px;
        margin-top:10px;
    }

    .catalog-secondary-btn{
        width:100%;
        border:none;
        border-radius:10px;
        padding:11px 14px;
        cursor:pointer;
        font-weight:800;
        background:#eef2f7;
        color:#243041;
    }

    .catalog-empty-state{
        grid-column:1/-1;
        background:#fffdf9;
        padding:28px;
        border-radius:18px;
        border:1px solid #ece7df;
        box-shadow:0 10px 24px rgba(0,0,0,0.05);
        text-align:center;
    }

    .catalog-empty-icon{
        font-size:40px;
        margin-bottom:10px;
    }

    .catalog-empty-state h3{
        margin:0 0 8px;
        color:#243041;
        font-size:24px;
    }

    .catalog-empty-state p{
        margin:0 0 16px;
        color:#6f7b8c;
        line-height:1.6;
    }

    .catalog-empty-btn{
        border:none;
        border-radius:12px;
        padding:12px 18px;
        background:#ff6600;
        color:#fff;
        font-weight:800;
        cursor:pointer;
    }

    .home-dynamic-block{
        margin:0 20px 16px;
        background:#fffdf9;
        border:1px solid #ece7df;
        border-radius:24px;
        box-shadow:0 10px 24px rgba(0,0,0,0.05);
        padding:18px;
    }

    .home-dynamic-head{
        display:flex;
        align-items:flex-end;
        justify-content:space-between;
        gap:14px;
        margin-bottom:12px;
        flex-wrap:wrap;
    }

    .home-dynamic-head h2{
        margin:0;
        color:#243041;
        font-size:26px;
    }

    .home-dynamic-head p{
        margin:0;
        color:#6f7b8c;
        font-size:14px;
        line-height:1.55;
    }

    .home-mini-grid{
        display:grid;
        grid-template-columns:repeat(4,minmax(0,1fr));
        gap:14px;
    }

    .home-mini-card{
        background:#fff;
        border:1px solid #ece7df;
        border-radius:18px;
        overflow:hidden;
        box-shadow:0 8px 20px rgba(0,0,0,0.04);
        display:flex;
        flex-direction:column;
    }

    .home-mini-card img{
        width:100%;
        height:170px;
        object-fit:cover;
        background:#f6ece0;
        display:block;
    }

    .home-mini-card-body{
        padding:14px;
        display:flex;
        flex-direction:column;
        gap:8px;
        flex:1;
    }

    .home-mini-card h3{
        margin:0;
        font-size:16px;
        line-height:1.3;
        color:#243041;
    }

    .home-mini-card p{
        margin:0;
        color:#6f7b8c;
        font-size:13px;
        line-height:1.5;
    }

    .home-mini-price{
        color:#ff6600;
        font-weight:800;
        font-size:18px;
        margin-top:auto;
    }

    .home-mini-actions{
        display:flex;
        gap:8px;
        margin-top:8px;
        flex-wrap:wrap;
    }

    .home-mini-actions button{
        flex:1;
        min-width:110px;
        border:none;
        border-radius:10px;
        padding:10px 12px;
        cursor:pointer;
        font-weight:800;
    }

    .home-mini-actions .primary{
        background:#ff6600;
        color:#fff;
    }

    .home-mini-actions .secondary{
        background:#eef2f7;
        color:#243041;
    }

    .quick-view-modal{
        position:fixed;
        inset:0;
        display:none;
        align-items:center;
        justify-content:center;
        background:rgba(17,24,39,0.54);
        z-index:9000;
        padding:20px;
    }

    .quick-view-modal.open{
        display:flex;
    }

    .quick-view-box{
        width:100%;
        max-width:980px;
        max-height:90vh;
        overflow:auto;
        background:#fffdf9;
        border-radius:24px;
        border:1px solid #ece7df;
        box-shadow:0 22px 60px rgba(0,0,0,0.24);
        padding:20px;
    }

    .quick-view-top{
        display:flex;
        justify-content:space-between;
        gap:12px;
        align-items:center;
        margin-bottom:14px;
    }

    .quick-view-top h2{
        margin:0;
        color:#243041;
    }

    .quick-view-close{
        border:none;
        width:42px;
        height:42px;
        border-radius:14px;
        background:#eef2f7;
        color:#243041;
        font-size:18px;
        cursor:pointer;
    }

    .quick-view-grid{
        display:grid;
        grid-template-columns:minmax(0,1fr) minmax(320px,420px);
        gap:20px;
    }

    .quick-view-main-image{
        width:100%;
        height:420px;
        object-fit:cover;
        border-radius:18px;
        background:#f6ece0;
        display:block;
    }

    .quick-view-thumbs{
        display:flex;
        gap:10px;
        margin-top:12px;
        flex-wrap:wrap;
    }

    .quick-view-thumbs img{
        width:78px;
        height:78px;
        object-fit:cover;
        border-radius:12px;
        border:2px solid transparent;
        cursor:pointer;
        background:#fff;
    }

    .quick-view-thumbs img.active{
        border-color:#ff6600;
    }

    .quick-view-price{
        color:#ff6600;
        font-weight:800;
        font-size:28px;
        margin:8px 0;
    }

    .quick-view-desc{
        color:#6f7b8c;
        line-height:1.65;
        font-size:15px;
        margin-bottom:14px;
    }

    .quick-view-actions{
        display:flex;
        gap:10px;
        flex-wrap:wrap;
    }

    .quick-view-actions button{
        flex:1;
        min-width:140px;
        border:none;
        border-radius:12px;
        padding:12px 14px;
        cursor:pointer;
        font-weight:800;
    }

    .quick-view-actions .primary{
        background:#ff6600;
        color:#fff;
    }

    .quick-view-actions .secondary{
        background:#eef2f7;
        color:#243041;
    }

    @media (max-width:1100px){
        .home-mini-grid{
            grid-template-columns:repeat(2,minmax(0,1fr));
        }
    }

    @media (max-width:900px){
        .smart-filters,
        .products-top-meta{
            padding-left:16px;
            padding-right:16px;
        }

        .home-dynamic-block{
            margin-left:16px;
            margin-right:16px;
        }

        .quick-view-grid{
            grid-template-columns:1fr;
        }
    }

    @media (max-width:680px){
        .home-mini-grid{
            grid-template-columns:1fr;
        }
    }
    `;
    document.head.appendChild(style);
}

/* ===== QUICK VIEW ===== */

function openQuickView(id) {
    const product = findProductById(id);
    if (!product) return;

    const modal = document.getElementById("quick-view-modal");
    const body = document.getElementById("quick-view-body");
    if (!modal || !body) return;

    const gallery = Array.isArray(product.gallery) && product.gallery.length
        ? product.gallery
        : [getSafeProductImage(product)];

    const stockName = typeof getStockStatusName === "function"
        ? getStockStatusName(product.stock_status)
        : "Є в наявності";

    body.innerHTML = `
        <div class="quick-view-grid">
            <div>
                <img id="quick-view-main-image" class="quick-view-main-image" src="${escapeHtmlAttr(gallery[0])}" alt="${escapeHtmlAttr(product.name)}" onerror="this.onerror=null;this.src='${PRODUCT_PLACEHOLDER}'">
                <div class="quick-view-thumbs">
                    ${gallery.map((img, index) => `
                        <img
                            src="${escapeHtmlAttr(img)}"
                            alt="${escapeHtmlAttr(product.name)}"
                            class="${index === 0 ? "active" : ""}"
                            onclick="setQuickViewImage('${escapeHtmlAttr(img)}', this)"
                            onerror="this.onerror=null;this.src='${PRODUCT_PLACEHOLDER}'"
                        >
                    `).join("")}
                </div>
            </div>

            <div>
                <div style="margin-bottom:8px;">${buildProductBadges(product)}</div>
                <h2 style="margin:0 0 8px;color:#243041;">${escapeHtmlText(product.name)}</h2>
                <div class="quick-view-price">${Number(product.price || 0)} грн</div>
                <div class="quick-view-desc">${escapeHtmlText(product.description || "Якісний дитячий товар для щоденного використання.")}</div>
                <div style="color:#6f7b8c;font-size:14px;font-weight:700;margin-bottom:14px;">Статус: ${escapeHtmlText(stockName)}</div>

                <div class="quantity" style="justify-content:flex-start;margin:0 0 14px;" onclick="event.stopPropagation()">
                    <button onclick="minus('${escapeHtmlAttr(product.id)}')">−</button>
                    <input id="qty-${escapeHtmlAttr(product.id)}" type="number" value="1" min="1" class="qty-input" ${String(product.stock_status) === "out_of_stock" ? "disabled" : ""}>
                    <button onclick="plus('${escapeHtmlAttr(product.id)}')">+</button>
                </div>

                <div class="quick-view-actions">
                    <button class="primary" type="button" ${String(product.stock_status) === "out_of_stock" ? "disabled" : ""} onclick="addToCart('${escapeHtmlAttr(product.id)}')">
                        ${String(product.stock_status) === "out_of_stock" ? "Немає в наявності" : "У кошик"}
                    </button>
                    <button class="secondary" type="button" onclick="closeQuickView(); openProduct('${escapeHtmlAttr(product.id)}')">Відкрити товар</button>
                </div>
            </div>
        </div>
    `;

    modal.classList.add("open");
    document.body.style.overflow = "hidden";
}

function setQuickViewImage(src, element) {
    const main = document.getElementById("quick-view-main-image");
    if (!main) return;

    main.src = src;

    const thumbs = document.querySelectorAll(".quick-view-thumbs img");
    thumbs.forEach(img => img.classList.remove("active"));
    if (element) element.classList.add("active");
}

function closeQuickView() {
    const modal = document.getElementById("quick-view-modal");
    if (!modal) return;

    modal.classList.remove("open");
    document.body.style.overflow = "";
}

/* ===== RESET FILTERS ===== */

function resetSmartFiltersAndShowAll() {
    activeCategory = "all";
    activeSearch = "";
    activeSort = "";

    const search = document.getElementById("search");
    if (search) search.value = "";

    const sortSelect = document.querySelector(".filters select");
    if (sortSelect) sortSelect.value = "";

    ["smart-hit", "smart-sale", "smart-new", "smart-available", "smart-favorites"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = false;
    });

    applyFiltersAndRender();
    saveStoreState();
}

/* ===== HOME SECTIONS ===== */

function renderHomeFavoritesSection() {
    const container = document.getElementById("home-favorites-grid");
    if (!container) return;

    const favorites = getFavorites();
    const list = getBaseProducts().filter(product => favorites.includes(String(product.id))).slice(0, 8);

    if (!list.length) {
        container.innerHTML = `<div class="showcase-empty">Улюблені товари з’являться тут після натискання на сердечко ❤</div>`;
        return;
    }

    container.innerHTML = list.map(product => `
        <article class="home-mini-card">
            <img src="${escapeHtmlAttr(getSafeProductImage(product))}" alt="${escapeHtmlAttr(product.name)}" onerror="this.onerror=null;this.src='${PRODUCT_PLACEHOLDER}'">
            <div class="home-mini-card-body">
                <h3>${escapeHtmlText(product.name)}</h3>
                <p>${escapeHtmlText((product.description || "").slice(0, 80))}${(product.description || "").length > 80 ? "…" : ""}</p>
                <div class="home-mini-price">${Number(product.price || 0)} грн</div>
                <div class="home-mini-actions">
                    <button class="secondary" type="button" onclick="openQuickView('${escapeHtmlAttr(product.id)}')">Перегляд</button>
                    <button class="primary" type="button" onclick="openProduct('${escapeHtmlAttr(product.id)}')">Відкрити</button>
                </div>
            </div>
        </article>
    `).join("");
}

function renderRecentlyViewedSection() {
    const container = document.getElementById("recently-viewed-grid");
    if (!container) return;

    const ids = getRecentlyViewedIds();
    const list = ids.map(id => findProductById(id)).filter(Boolean).slice(0, 8);

    if (!list.length) {
        container.innerHTML = `<div class="showcase-empty">Тут з’являться товари, які покупець переглядав останніми.</div>`;
        return;
    }

    container.innerHTML = list.map(product => `
        <article class="home-mini-card">
            <img src="${escapeHtmlAttr(getSafeProductImage(product))}" alt="${escapeHtmlAttr(product.name)}" onerror="this.onerror=null;this.src='${PRODUCT_PLACEHOLDER}'">
            <div class="home-mini-card-body">
                <h3>${escapeHtmlText(product.name)}</h3>
                <p>${escapeHtmlText((product.description || "").slice(0, 80))}${(product.description || "").length > 80 ? "…" : ""}</p>
                <div class="home-mini-price">${Number(product.price || 0)} грн</div>
                <div class="home-mini-actions">
                    <button class="secondary" type="button" onclick="openQuickView('${escapeHtmlAttr(product.id)}')">Перегляд</button>
                    <button class="primary" type="button" onclick="openProduct('${escapeHtmlAttr(product.id)}')">Відкрити</button>
                </div>
            </div>
        </article>
    `).join("");
}

/* ===== OPEN PRODUCT ===== */

function openProduct(id) {
    const product = findProductById(id);
    if (!product) return;

    saveStoreState();
    addRecentlyViewed(id);

    localStorage.setItem("selectedProduct", JSON.stringify(product));
    localStorage.setItem("kids_room_return_url", window.location.href);

    window.location.href = "product.html";
}

/* ===== SEARCH / SORT / CATEGORY ===== */

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

/* ===== HEADER SCROLL ===== */

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

/* ===== QUANTITY ===== */

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

/* ===== READY ===== */

function handleProductsReady() {
    ensureSidebarCategoryMarkers();
    applyFiltersAndRender();
    restoreStoreScroll();
    renderHomeFavoritesSection();
    renderRecentlyViewedSection();
}

window.addEventListener("products:ready", handleProductsReady);
window.addEventListener("products:updated", handleProductsReady);

window.addEventListener("storage", event => {
    if (event.key === "products") {
        handleProductsReady();
    }

    if (event.key === FAVORITES_KEY) {
        renderHomeFavoritesSection();
        applyFiltersAndRender();
    }

    if (event.key === RECENTLY_VIEWED_KEY) {
        renderRecentlyViewedSection();
    }
});

window.addEventListener("favorites:updated", () => {
    renderHomeFavoritesSection();
});

window.addEventListener("recently:viewed", () => {
    renderRecentlyViewedSection();
});

if (typeof renderCart === "function") {
    renderCart();
}

window.addEventListener("resize", syncCatalogMenuOnResize);

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeCatalogMenu();
        closeQuickView();
    }
});

document.addEventListener("change", event => {
    if (event.target && event.target.matches(".smart-filters input")) {
        applyFiltersAndRender();
        saveStoreState();
    }
});

syncCatalogMenuOnResize();
ensureSidebarCategoryMarkers();
restoreStoreStateFromSession();

if (typeof window.productsReady === "function" && window.productsReady()) {
    handleProductsReady();
}

window.addEventListener("beforeunload", saveStoreState);

/* ===== EXPORTS ===== */

window.filterCategory = filterCategory;
window.sortProducts = sortProducts;
window.plus = plus;
window.minus = minus;
window.openProduct = openProduct;
window.toggleCatalogMenu = toggleCatalogMenu;
window.closeCatalogMenu = closeCatalogMenu;
window.toggleFavorite = toggleFavorite;
window.openQuickView = openQuickView;
window.closeQuickView = closeQuickView;
window.setQuickViewImage = setQuickViewImage;
window.resetSmartFiltersAndShowAll = resetSmartFiltersAndShowAll;
window.renderHomeFavoritesSection = renderHomeFavoritesSection;
window.renderRecentlyViewedSection = renderRecentlyViewedSection;