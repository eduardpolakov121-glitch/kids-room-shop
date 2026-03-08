const container = document.getElementById("products");
const categoryList = document.getElementById("category-list");
let currentProducts = Array.isArray(products) ? [...products] : [];
let activeCategory = "all";

function renderCategoryMenu() {
    if (!categoryList) return;

    const html = [
        `<li class="${activeCategory === "all" ? "active" : ""}" onclick="filterCategory('all')">✨ Всі товари</li>`,
        ...CATEGORIES.map(category => `
            <li class="${activeCategory === category.id ? "active" : ""}" onclick="filterCategory('${category.id}')">
                ${category.icon} ${category.name}
            </li>
        `)
    ].join("");

    categoryList.innerHTML = html;
}

function getFilteredProductsBySearch(list, searchValue) {
    const value = String(searchValue || "").toLowerCase().trim();
    if (!value) return list;

    return list.filter(product => {
        const haystack = [
            product.name,
            product.description,
            getCategoryName(product.category)
        ].join(" ").toLowerCase();

        return haystack.includes(value);
    });
}

function syncProductsAndRender() {
    refreshProductsFromStorage();

    const baseList = activeCategory === "all"
        ? [...products]
        : products.filter(item => item.category === activeCategory);

    currentProducts = baseList;

    const searchValue = document.getElementById("search")?.value || "";
    const finalList = getFilteredProductsBySearch(baseList, searchValue);

    renderCategoryMenu();
    renderProducts(finalList);
}

function renderProducts(list) {
    if (!container) return;

    container.innerHTML = "";

    if (!Array.isArray(list) || list.length === 0) {
        container.innerHTML = `
        <div class="empty-products">
            Товари поки що відсутні
        </div>
        `;
        return;
    }

    list.forEach(product => {
        const safeImg = getSafeProductImage(product);
        const oldPriceHtml = product.old > product.price
            ? `<span class="old-price" id="old-${product.id}">${product.old} грн</span>`
            : "";

        container.innerHTML += `
        <div class="product" id="prod-${product.id}" onclick="openProduct('${product.id}')">
            <div class="product-image-wrap">
                <img src="${safeImg}" alt="${product.name}" loading="lazy" onerror="this.onerror=null;this.src='${PRODUCT_PLACEHOLDER}'">
                <span class="product-category-badge">${getCategoryIcon(product.category)} ${getCategoryName(product.category)}</span>
            </div>
            <h3>${product.name}</h3>
            <div class="price">
                ${oldPriceHtml}
                <span>${product.price} грн</span>
            </div>
            <div class="quantity" onclick="event.stopPropagation()">
                <button type="button" onclick="minus('${product.id}')">−</button>
                <input
                    id="qty-${product.id}"
                    type="number"
                    value="1"
                    min="1"
                    class="qty-input"
                    inputmode="numeric"
                >
                <button type="button" onclick="plus('${product.id}')">+</button>
            </div>
            <button class="add-btn" type="button" onclick="event.stopPropagation(); addToCart('${product.id}')">
                Додати в кошик
            </button>
        </div>
        `;
    });
}

function openProduct(id) {
    refreshProductsFromStorage();
    const product = products.find(item => item.id === id);
    if (!product) return;

    localStorage.setItem("selectedProduct", JSON.stringify(product));
    window.open("product.html", "_blank");
}

const searchEl = document.getElementById("search");
if (searchEl) {
    searchEl.addEventListener("input", e => {
        const filtered = getFilteredProductsBySearch(currentProducts, e.target.value);
        renderProducts(filtered);
    });
}

function filterCategory(categoryId) {
    activeCategory = categoryId;
    const search = document.getElementById("search");
    if (search) search.value = "";
    syncProductsAndRender();
}

function sortProducts(type) {
    const sorted = [...currentProducts];

    if (type === "cheap") sorted.sort((a, b) => a.price - b.price);
    if (type === "expensive") sorted.sort((a, b) => b.price - a.price);
    if (type === "name") sorted.sort((a, b) => a.name.localeCompare(b.name, "uk"));

    renderProducts(sorted);
}

let lastScroll = 0;
const header = document.querySelector("header");

window.addEventListener("scroll", () => {
    const current = window.pageYOffset;

    if (header) {
        if (current > lastScroll && current > 120 && window.innerWidth > 768) {
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
    el.value = parseInt(el.value || "1", 10) + 1;
}

function minus(id) {
    const el = document.getElementById("qty-" + id);
    if (!el) return;

    const val = parseInt(el.value || "1", 10);
    if (val > 1) el.value = val - 1;
}

window.addEventListener("products:updated", syncProductsAndRender);
window.addEventListener("storage", event => {
    if (event.key === "products") {
        syncProductsAndRender();
    }
});

renderCategoryMenu();
syncProductsAndRender();
renderCart();
