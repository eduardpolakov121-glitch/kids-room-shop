const container = document.getElementById("products");
let currentProducts = Array.isArray(products) ? [...products] : [];

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

function syncProductsAndRender(keepFilter = true) {
    const prevSearch = document.getElementById("search")?.value?.toLowerCase().trim() || "";
    const prevIds = keepFilter ? currentProducts.map(item => item.id) : [];

    refreshProductsFromStorage();

    if (keepFilter && prevIds.length) {
        currentProducts = products.filter(item => prevIds.includes(item.id));
        if (!currentProducts.length) currentProducts = [...products];
    } else {
        currentProducts = [...products];
    }

    if (prevSearch) {
        const filtered = currentProducts.filter(p => p.name.toLowerCase().includes(prevSearch));
        renderProducts(filtered);
        return;
    }

    renderProducts(currentProducts);
    closeCatalogMenu();
}

/* РЕНДЕР ТОВАРІВ */
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

    list.forEach(p => {
        container.innerHTML += `
        <div class="product" id="prod-${p.id}" onclick="openProduct('${p.id}')">
            <img src="${p.img}" alt="${p.name}">
            <h3>${p.name}</h3>
            <div class="price">
                <span class="old-price" id="old-${p.id}">${p.old} грн</span>
                <span>${p.price} грн</span>
            </div>
            <div class="quantity" onclick="event.stopPropagation()">
                <button onclick="minus('${p.id}')">−</button>
                <input
                    id="qty-${p.id}"
                    type="number"
                    value="1"
                    min="1"
                    class="qty-input"
                >
                <button onclick="plus('${p.id}')">+</button>
            </div>
            <button class="add-btn" onclick="event.stopPropagation(); addToCart('${p.id}')">
                Додати в кошик
            </button>
        </div>
        `;
    });
}

syncProductsAndRender(false);

/* ВІДКРИТТЯ ТОВАРУ В НОВІЙ ВКЛАДЦІ */
function openProduct(id) {
    refreshProductsFromStorage();
    const product = products.find(p => p.id === id);
    if (!product) return;

    localStorage.setItem("selectedProduct", JSON.stringify(product));
    localStorage.setItem("kids_room_return_url", window.location.href);
    window.open("product.html", "_blank");
}

/* ПОШУК */
const searchEl = document.getElementById("search");
if (searchEl) {
    searchEl.addEventListener("input", e => {
        const value = e.target.value.toLowerCase().trim();
        const filtered = currentProducts.filter(p => p.name.toLowerCase().includes(value));
        renderProducts(filtered);
    });
}

/* КАТЕГОРІЇ */
function filterCategory(cat) {
    refreshProductsFromStorage();

    if (cat === "all") {
        currentProducts = [...products];
    } else {
        currentProducts = products.filter(p => p.category === cat);
    }

    const search = document.getElementById("search");
    if (search) search.value = "";

    renderProducts(currentProducts);
    closeCatalogMenu();
}

/* СОРТУВАННЯ */
function sortProducts(type) {
    const sorted = [...currentProducts];

    if (type === "cheap") {
        sorted.sort((a, b) => a.price - b.price);
    }

    if (type === "expensive") {
        sorted.sort((a, b) => b.price - a.price);
    }

    if (type === "name") {
        sorted.sort((a, b) => a.name.localeCompare(b.name, "uk"));
    }

    renderProducts(sorted);
}

/* HEADER SCROLL */
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

/* КІЛЬКІСТЬ */
function plus(id) {
    const el = document.getElementById("qty-" + id);
    if (!el) return;
    el.value = parseInt(el.value || "1", 10) + 1;
}

function minus(id) {
    const el = document.getElementById("qty-" + id);
    if (!el) return;

    const val = parseInt(el.value || "1", 10);
    if (val > 1) {
        el.value = val - 1;
    }
}

window.addEventListener("products:updated", () => syncProductsAndRender(false));
window.addEventListener("storage", event => {
    if (event.key === "products") {
        syncProductsAndRender(false);
    }
});

/* КОШИК */
renderCart();


window.addEventListener("resize", syncCatalogMenuOnResize);
document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeCatalogMenu();
});
syncCatalogMenuOnResize();
