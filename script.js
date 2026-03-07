const container = document.getElementById("products");
let currentProducts = products;

/* РЕНДЕР ТОВАРІВ */

function renderProducts(list) {
    container.innerHTML = "";

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

renderProducts(products);

/* ВІДКРИТТЯ ТОВАРУ В НОВІЙ ВКЛАДЦІ */

function openProduct(id) {
    let product = products.find(p => p.id === id);

    if (!product) return;

    localStorage.setItem("selectedProduct", JSON.stringify(product));

    window.open("product.html", "_blank");
}

/* ПОШУК */

document.getElementById("search").addEventListener("input", e => {
    let value = e.target.value.toLowerCase().trim();

    let filtered = currentProducts.filter(p =>
        p.name.toLowerCase().includes(value)
    );

    renderProducts(filtered);
});

/* КАТЕГОРІЇ */

function filterCategory(cat) {
    if (cat === "all") {
        currentProducts = products;
    } else {
        currentProducts = products.filter(p => p.category === cat);
    }

    let search = document.getElementById("search");
    if (search) search.value = "";

    renderProducts(currentProducts);
}

/* СОРТУВАННЯ */

function sortProducts(type) {
    let sorted = [...currentProducts];

    if (type === "cheap") {
        sorted.sort((a, b) => a.price - b.price);
    }

    if (type === "expensive") {
        sorted.sort((a, b) => b.price - a.price);
    }

    if (type === "name") {
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    }

    renderProducts(sorted);
}

/* HEADER SCROLL */

let lastScroll = 0;
const header = document.querySelector("header");

window.addEventListener("scroll", () => {
    let current = window.pageYOffset;

    if (current > lastScroll && current > 100) {
        header.classList.add("hide");
    } else {
        header.classList.remove("hide");
    }

    lastScroll = current;
});

/* КІЛЬКІСТЬ */

function plus(id) {
    let el = document.getElementById("qty-" + id);
    if (!el) return;

    el.value = parseInt(el.value) + 1;
}

function minus(id) {
    let el = document.getElementById("qty-" + id);
    if (!el) return;

    let val = parseInt(el.value);
    if (val > 1) {
        el.value = val - 1;
    }
}

/* КОШИК */

renderCart();