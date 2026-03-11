const container = document.getElementById("products");

let currentProducts = [];
let activeCategory = "all";
let activeSort = "";
let activeSearch = "";
let selectedProductForModal = null;

const mobileCatalogBreakpoint = 900;
let headerScrollRaf = null;
let renderScheduled = false;

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

function escapeHtmlText(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function escapeHtmlAttr(value) {
    return escapeHtmlText(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function getDiscountPercent(product) {
    const oldPrice = Number(product?.old || 0);
    const currentPrice = Number(product?.price || 0);

    if (!oldPrice || !currentPrice || oldPrice <= currentPrice) return null;
    return Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
}

function buildProductBadges(product) {
    const badges = [];

    if (product?.is_hit) badges.push(`<span class="catalog-badge badge-hit">ХІТ</span>`);
    if (product?.is_sale) badges.push(`<span class="catalog-badge badge-sale">АКЦІЯ</span>`);
    if (product?.is_new) badges.push(`<span class="catalog-badge badge-new">НОВИНКА</span>`);

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
        max-width:78%;
    }

    .product-card-with-badges .catalog-badge{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        padding:7px 10px;
        border-radius:999px;
        font-size:11px;
        font-weight:800;
        line-height:1;
        box-shadow:0 8px 16px rgba(0,0,0,0.08);
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

function renderProducts(list) {
    if (!container) return;

    if (!Array.isArray(list) || list.length === 0) {
        container.innerHTML = `
        <div style="grid-column:1/-1; background:#fffdf9; padding:24px; border-radius:20px; box-shadow:0 10px 24px rgba(0,0,0,0.06); text-align:center; color:#748097;">
            Товари поки що відсутні
        </div>
        `;
        return;
    }

    container.innerHTML = list.map(product => {
        const discount = getDiscountPercent(product);

        return `
        <div class="product product-card-with-badges" id="prod-${product.id}" onclick="openProduct('${escapeHtmlAttr(product.id)}')">
            <div class="product-image-wrap">
                ${buildProductBadges(product)}
                <img src="${getSafeProductImage(product)}" alt="${escapeHtmlAttr(product.name)}" onerror="this.onerror=null;this.src='${PRODUCT_PLACEHOLDER}'">
            </div>

            <h3>${escapeHtmlText(product.name)}</h3>

            ${buildProductPrice(product)}

            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;color:#748097;font-size:13px;font-weight:700;">
                <span>⭐ 4.8 / 5</span>
                <span>${discount ? "Знижка " + discount + "%" : "В наявності"}</span>
            </div>

            <div class="quantity" onclick="event.stopPropagation()">
                <button type="button" onclick="minus('${escapeHtmlAttr(product.id)}')">−</button>
                <input
                    id="qty-${escapeHtmlAttr(product.id)}"
                    type="number"
                    value="1"
                    min="1"
                    class="qty-input"
                >
                <button type="button" onclick="plus('${escapeHtmlAttr(product.id)}')">+</button>
            </div>

            <button class="add-btn" type="button" onclick="event.stopPropagation(); addToCart('${escapeHtmlAttr(product.id)}')">
                Додати в кошик
            </button>
        </div>
    `;
    }).join("");

    injectCatalogBadgeStyles();
}

function updateActiveCategoryUI() {
    const items = document.querySelectorAll(".sidebar li");
    items.forEach(item => item.classList.remove("active", "selected"));

    const activeItem = document.querySelector(`.sidebar li[data-category="${activeCategory}"]`);
    if (activeItem) {
        activeItem.classList.add("active", "selected");
    }

    const chips = document.querySelectorAll(".catalog-chip[data-catalog-chip]");
    chips.forEach(chip => chip.classList.remove("active"));
    const activeChip = document.querySelector(`.catalog-chip[data-catalog-chip="${activeCategory}"]`);
    if (activeChip) activeChip.classList.add("active");
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
        list = list.filter(product => String(product.category) === String(activeCategory));
    }

    if (activeSearch) {
        const search = activeSearch.toLowerCase();
        list = list.filter(product =>
            String(product.name || "").toLowerCase().includes(search) ||
            String(product.description || "").toLowerCase().includes(search)
        );
    }

    if (activeSort === "cheap") {
        list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }

    if (activeSort === "expensive") {
        list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }

    if (activeSort === "name") {
        list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "uk"));
    }

    currentProducts = list;
    renderProducts(currentProducts);
    updateActiveCategoryUI();
}

function scheduleRender() {
    if (renderScheduled) return;

    renderScheduled = true;
    requestAnimationFrame(() => {
        renderScheduled = false;
        applyFiltersAndRender();
    });
}

function changeQtyValue(targetId, delta) {
    const el = document.getElementById(targetId);
    if (!el) return;

    const value = parseInt(el.value || "1", 10);
    const safeValue = Number.isNaN(value) ? 1 : value;
    const next = safeValue + delta;

    el.value = next < 1 ? 1 : next;
}

function plus(id) {
    changeQtyValue("qty-" + String(id), 1);
}

function minus(id) {
    changeQtyValue("qty-" + String(id), -1);
}

function sortProducts(type) {
    activeSort = type || "";
    scheduleRender();
}

function filterCategory(category) {
    activeCategory = category || "all";

    const search = document.getElementById("search");
    if (search) search.value = "";

    const wideSearch = document.getElementById("search-catalog-wide");
    if (wideSearch) wideSearch.value = "";

    activeSearch = "";

    scheduleRender();
    closeCatalogMenu();
}

function getProductModalBadges(product) {
    const badges = [];

    if (product?.is_hit) badges.push(`<span class="product-detail-badge hit">ХІТ</span>`);
    if (product?.is_sale) badges.push(`<span class="product-detail-badge sale">АКЦІЯ</span>`);
    if (product?.is_new) badges.push(`<span class="product-detail-badge new">НОВИНКА</span>`);
    badges.push(`<span class="product-detail-badge category">${escapeHtmlText(getCategoryName(product.category))}</span>`);

    return badges.join("");
}

function buildBundleCandidates(product) {
    const all = getBaseProducts();

    const sameCategory = all
        .filter(item => String(item.id) !== String(product.id) && String(item.category) === String(product.category))
        .slice(0, 2);

    if (sameCategory.length >= 2) return sameCategory;

    return all
        .filter(item => String(item.id) !== String(product.id))
        .slice(0, 2);
}

function buildBundleSection(product) {
    const bundleItems = buildBundleCandidates(product);
    if (!bundleItems.length) return "";

    const selected = [product, ...bundleItems];
    const total = selected.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const oldTotal = selected.reduce((sum, item) => sum + Number(item.old || item.price || 0), 0);

    return `
        <div class="product-bundle-box">
            <div class="product-bundle-head">
                <div>
                    <h3>Купують разом</h3>
                    <p>Готова добірка товарів для зручної покупки одним натисканням.</p>
                </div>
            </div>

            <div class="product-bundle-grid">
                ${selected.map((item, index) => `
                    ${index > 0 ? `<div class="bundle-plus">+</div>` : ""}
                    <div class="bundle-product-card">
                        <img src="${escapeHtmlAttr(getSafeProductImage(item))}" alt="${escapeHtmlAttr(item.name)}" onerror="this.onerror=null;this.src='product-placeholder.svg'">
                        <h4>${escapeHtmlText(item.name)}</h4>
                        <p>${escapeHtmlText(String(item.description || "").slice(0, 90))}${String(item.description || "").length > 90 ? "…" : ""}</p>
                        <div class="bundle-price">${Number(item.price || 0)} грн</div>
                    </div>
                `).join("")}

                <div class="bundle-summary">
                    <h4>Разом комплект</h4>

                    ${selected.map(item => `
                        <div class="bundle-summary-row">
                            <span>${escapeHtmlText(item.name)}</span>
                            <strong>${Number(item.price || 0)} грн</strong>
                        </div>
                    `).join("")}

                    <div class="bundle-total">
                        <div>
                            <div style="font-size:13px;color:#748097;font-weight:700;">Економія по комплекту</div>
                            <div style="font-size:14px;color:#2f3746;font-weight:800;">${Math.max(oldTotal - total, 0)} грн</div>
                        </div>
                        <div class="price">${total} грн</div>
                    </div>

                    <button type="button" onclick="addBundleToCart('${escapeHtmlAttr(product.id)}')">Додати комплект</button>
                </div>
            </div>
        </div>
    `;
}

function renderProductModal(product) {
    const content = document.getElementById("product-detail-content");
    if (!content || !product) return;

    const oldPrice = Number(product.old || 0);
    const currentPrice = Number(product.price || 0);
    const discount = getDiscountPercent(product);
    const badges = getProductModalBadges(product);

    content.innerHTML = `
        <div class="product-detail-layout">
            <div class="product-detail-gallery">
                <div class="product-detail-image-wrap">
                    <img src="${escapeHtmlAttr(getSafeProductImage(product))}" alt="${escapeHtmlAttr(product.name)}" onerror="this.onerror=null;this.src='product-placeholder.svg'">
                </div>
            </div>

            <div class="product-detail-info">
                <div class="product-detail-badges">${badges}</div>

                <h2 class="product-detail-title">${escapeHtmlText(product.name)}</h2>
                <p class="product-detail-subtext">${escapeHtmlText(product.description || "Якісний дитячий товар для щоденного використання.")}</p>

                <div class="product-detail-price">
                    <span class="current">${currentPrice} грн</span>
                    ${oldPrice > currentPrice ? `<span class="old">${oldPrice} грн</span>` : ""}
                    ${discount ? `<span class="save">-${discount}%</span>` : ""}
                </div>

                <div class="product-detail-features">
                    <div class="product-detail-feature">
                        <strong>Категорія</strong>
                        <span>${escapeHtmlText(getCategoryName(product.category))}</span>
                    </div>
                    <div class="product-detail-feature">
                        <strong>Доставка</strong>
                        <span>Безкоштовно від 1000 грн</span>
                    </div>
                    <div class="product-detail-feature">
                        <strong>Наявність</strong>
                        <span>Товар доступний до замовлення</span>
                    </div>
                    <div class="product-detail-feature">
                        <strong>Оформлення</strong>
                        <span>Швидкий кошик і замовлення в 1 вікні</span>
                    </div>
                </div>

                <div class="product-detail-buy">
                    <div class="product-detail-buy-top">
                        <div class="product-detail-stock">✅ Є в наявності</div>

                        <div class="product-detail-qty">
                            <span>Кількість</span>
                            <div class="product-detail-qty-control">
                                <button type="button" onclick="minus('modal-${escapeHtmlAttr(product.id)}')">−</button>
                                <input id="qty-modal-${escapeHtmlAttr(product.id)}" type="number" min="1" value="1">
                                <button type="button" onclick="plus('modal-${escapeHtmlAttr(product.id)}')">+</button>
                            </div>
                        </div>
                    </div>

                    <div class="product-detail-actions">
                        <button class="primary" type="button" onclick="addModalProductToCart('${escapeHtmlAttr(product.id)}')">Додати в кошик</button>
                        <button class="secondary" type="button" onclick="forceCloseProductModal()">Продовжити покупки</button>
                    </div>

                    <div class="product-detail-note">
                        Замовлення оформлюється швидко, а доставка від 1000 грн — безкоштовна.
                    </div>
                </div>
            </div>

            ${buildBundleSection(product)}
        </div>
    `;
}

function openProduct(id) {
    const product = findProductById(id);
    if (!product) return;

    selectedProductForModal = product;
    const modal = document.getElementById("product-detail-modal");
    if (!modal) return;

    renderProductModal(product);
    modal.classList.add("open");
    document.body.classList.add("product-modal-open");
}

function forceCloseProductModal() {
    const modal = document.getElementById("product-detail-modal");
    if (!modal) return;

    modal.classList.remove("open");
    document.body.classList.remove("product-modal-open");
    selectedProductForModal = null;
}

function closeProductModal(event) {
    if (!event || event.target.id === "product-detail-modal") {
        forceCloseProductModal();
    }
}

function addModalProductToCart(id) {
    const modalQty = document.getElementById("qty-modal-" + id);
    const realQty = document.getElementById("qty-" + id);

    let helperInput = realQty;

    if (!helperInput) {
        helperInput = document.createElement("input");
        helperInput.type = "hidden";
        helperInput.id = "qty-" + id;
        document.body.appendChild(helperInput);
    }

    helperInput.value = modalQty ? modalQty.value : "1";

    if (typeof addToCart === "function") {
        addToCart(id);
    }
}

function addBundleToCart(mainId) {
    const mainProduct = findProductById(mainId);
    if (!mainProduct) return;

    const bundleItems = [mainProduct, ...buildBundleCandidates(mainProduct)];

    bundleItems.forEach(item => {
        let helperInput = document.getElementById("qty-" + item.id);
        if (!helperInput) {
            helperInput = document.createElement("input");
            helperInput.type = "hidden";
            helperInput.id = "qty-" + item.id;
            document.body.appendChild(helperInput);
        }
        helperInput.value = "1";

        if (typeof addToCart === "function") {
            addToCart(item.id);
        }
    });
}

const searchEl = document.getElementById("search");
if (searchEl) {
    searchEl.addEventListener("input", event => {
        activeSearch = event.target.value.trim();
        const wide = document.getElementById("search-catalog-wide");
        if (wide) wide.value = activeSearch;
        scheduleRender();
    });
}

const wideSearchEl = document.getElementById("search-catalog-wide");
if (wideSearchEl) {
    wideSearchEl.addEventListener("input", event => {
        activeSearch = event.target.value.trim();
        if (searchEl) searchEl.value = activeSearch;
        scheduleRender();
    });
}

let lastScroll = 0;
const header = document.querySelector("header");

window.addEventListener("scroll", () => {
    if (headerScrollRaf) return;

    headerScrollRaf = requestAnimationFrame(() => {
        const current = window.pageYOffset;

        if (header) {
            if (current > lastScroll && current > 100) {
                header.classList.add("hide");
            } else {
                header.classList.remove("hide");
            }
        }

        lastScroll = current;
        headerScrollRaf = null;
    });
}, { passive: true });

function handleProductsReady() {
    ensureSidebarCategoryMarkers();
    scheduleRender();
}

window.addEventListener("products:ready", handleProductsReady);
window.addEventListener("products:updated", handleProductsReady);

window.addEventListener("storage", event => {
    if (event.key === "products") {
        handleProductsReady();
    }
});

window.addEventListener("resize", syncCatalogMenuOnResize);

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeCatalogMenu();
        forceCloseProductModal();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    syncCatalogMenuOnResize();
    ensureSidebarCategoryMarkers();

    if (typeof window.productsReady === "function" && window.productsReady()) {
        handleProductsReady();
    } else {
        scheduleRender();
    }
});

window.filterCategory = filterCategory;
window.sortProducts = sortProducts;
window.openProduct = openProduct;
window.closeProductModal = closeProductModal;
window.forceCloseProductModal = forceCloseProductModal;
window.addModalProductToCart = addModalProductToCart;
window.addBundleToCart = addBundleToCart;
window.plus = plus;
window.minus = minus;
window.toggleCatalogMenu = toggleCatalogMenu;
window.closeCatalogMenu = closeCatalogMenu;