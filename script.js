const container = document.getElementById("products");
let currentProducts = [...products];
let activeCategory = "all";
let activeSearch = "";
let activeSort = "";

function applyFilters() {
    let list = [...products];

    if (activeCategory !== "all") {
        list = list.filter(p => p.category === activeCategory);
    }

    if (activeSearch) {
        const query = activeSearch.toLowerCase();
        list = list.filter(p => (p.name || "").toLowerCase().includes(query));
    }

    if (activeSort === "cheap") {
        list.sort((a, b) => a.price - b.price);
    }

    if (activeSort === "expensive") {
        list.sort((a, b) => b.price - a.price);
    }

    if (activeSort === "name") {
        list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    currentProducts = list;
    renderProducts(currentProducts);
}

function renderProducts(list) {
    container.innerHTML = "";

    if (!list.length) {
        container.innerHTML = `
        <div class="product" style="grid-column:1/-1; cursor:default;">
            <h3>Товари не знайдено</h3>
            <p style="color:#667788; margin:0;">Спробуйте іншу категорію або інший запит у пошуку.</p>
        </div>`;
        return;
    }

    list.forEach(p => {
        container.innerHTML += `
        <div class="product" id="prod-${p.id}" onclick="openProduct('${p.id}')">
            <img src="${p.img || ''}" alt="${p.name || ''}">
            <h3>${p.name || ''}</h3>
            <div class="price">
                <span class="old-price" ${p.old && p.old > p.price ? '' : 'style="display:none"'}>${p.old || ''} грн</span>
                <span>${p.price} грн</span>
            </div>
            <div class="quantity" onclick="event.stopPropagation()">
                <button onclick="minus('${p.id}')">−</button>
                <input id="qty-${p.id}" type="number" value="1" min="1" class="qty-input">
                <button onclick="plus('${p.id}')">+</button>
            </div>
            <button class="add-btn" onclick="event.stopPropagation(); addToCart('${p.id}')">Додати в кошик</button>
        </div>`;
    });
}

function openProduct(id) {
    let product = products.find(p => p.id === id);
    if (!product) return;

    localStorage.setItem("selectedProduct", JSON.stringify(product));
    window.open("product.html", "_blank");
}

document.getElementById("search").addEventListener("input", e => {
    activeSearch = e.target.value.trim();
    applyFilters();
});

function filterCategory(cat) {
    activeCategory = cat;
    applyFilters();
}

function sortProducts(type) {
    activeSort = type;
    applyFilters();
}

let lastScroll = 0;
const header = document.querySelector("header");

window.addEventListener("scroll", () => {
    let current = window.pageYOffset;
    if (current > lastScroll && current > 140) {
        header.classList.add("hide");
    } else {
        header.classList.remove("hide");
    }
    lastScroll = current;
});

function plus(id) {
    let el = document.getElementById("qty-" + id);
    if (!el) return;
    el.value = parseInt(el.value || "1", 10) + 1;
}

function minus(id) {
    let el = document.getElementById("qty-" + id);
    if (!el) return;
    let val = parseInt(el.value || "1", 10);
    if (val > 1) {
        el.value = val - 1;
    }
}

window.addEventListener("storage", event => {
    if (event.key === "products") {
        products = JSON.parse(localStorage.getItem("products")) || [];
        applyFilters();
    }

    if (event.key === "cart") {
        renderCart();
    }
});

applyFilters();
renderCart();
