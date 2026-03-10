let cart = JSON.parse(localStorage.getItem("cart")) || [];

const NOVA_POSHTA_API_KEY = "0cddc3bd30e2e4de2f2ce8f46313a168";
const NOVA_POSHTA_API_URL = "https://api.novaposhta.ua/v2.0/json/";

let selectedCity = null;
let lastCheckoutOrderNumber = "";

function getCheckoutSuccessOrderNumber(payload) {
    const rawId = Array.isArray(payload) ? payload[0]?.id : payload?.id;
    const rawString = String(rawId || "").trim();
    const digits = rawString.replace(/\D/g, "");

    if (digits.length >= 5) return "#" + digits.slice(-6);
    if (rawString) return "#" + rawString.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();

    return "#KR" + String(Date.now()).slice(-6);
}

function openSuccessModal(orderNumber) {
    const modal = document.getElementById("checkout-success-modal");
    const number = document.getElementById("success-order-number");

    lastCheckoutOrderNumber = orderNumber || getCheckoutSuccessOrderNumber(null);

    if (number) number.textContent = lastCheckoutOrderNumber;
    if (!modal) return;

    modal.classList.add("open");
    document.body.classList.add("success-modal-open");
}

function closeSuccessModal(event) {
    if (event && event.target && event.target.id !== "checkout-success-modal") return;

    const modal = document.getElementById("checkout-success-modal");
    if (!modal) return;

    modal.classList.remove("open");
    document.body.classList.remove("success-modal-open");
}

function toggleCart() {
    const cartEl = document.getElementById("cart");
    const overlay = document.getElementById("cart-overlay");
    if (!cartEl || !overlay) return;

    cartEl.classList.toggle("open");
    overlay.classList.toggle("active");
}

function closeCart() {
    const cartEl = document.getElementById("cart");
    const overlay = document.getElementById("cart-overlay");
    if (!cartEl || !overlay) return;

    cartEl.classList.remove("open");
    overlay.classList.remove("active");
}

function normalizeCartItem(product, qty = 1) {
    return {
        id: String(product?.id || ""),
        name: String(product?.name || "Товар"),
        price: Number(product?.price || 0),
        old: Number(product?.old || 0),
        category: String(product?.category || ""),
        description: String(product?.description || ""),
        img: getCartItemImage(product),
        qty: Math.max(1, Number(qty || product?.qty || 1)),
        is_hit: !!product?.is_hit,
        is_sale: !!product?.is_sale,
        is_new: !!product?.is_new
    };
}

function syncCartWithProducts() {
    if (!Array.isArray(window.products) || !window.products.length) return;

    cart = cart.map(item => {
        const fresh = window.products.find(p => String(p.id) === String(item.id));
        if (!fresh) return normalizeCartItem(item, item.qty);
        return normalizeCartItem({ ...item, ...fresh }, item.qty);
    });

    localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(id) {
    if (typeof refreshProductsFromStorage === "function") {
        refreshProductsFromStorage();
    }

    const qtyInput = document.getElementById("qty-" + id);
    let qty = parseInt(qtyInput ? qtyInput.value : 1, 10);

    if (isNaN(qty) || qty < 1) qty = 1;

    const product = Array.isArray(window.products)
        ? window.products.find(p => String(p.id) === String(id))
        : null;

    if (!product) return;

    const item = cart.find(p => String(p.id) === String(id));

    if (item) {
        item.qty += qty;
        item.name = product.name;
        item.price = Number(product.price || 0);
        item.old = Number(product.old || 0);
        item.category = product.category || "";
        item.description = product.description || "";
        item.img = getCartItemImage(product);
        item.is_hit = !!product.is_hit;
        item.is_sale = !!product.is_sale;
        item.is_new = !!product.is_new;
    } else {
        cart.push(normalizeCartItem(product, qty));
    }

    renderCart();
    saveCart();
    showToast("Товар додано в кошик");
}

function cartPlus(id) {
    const item = cart.find(p => String(p.id) === String(id));
    if (!item) return;

    item.qty++;
    renderCart();
    saveCart();
}

function cartMinus(id) {
    const item = cart.find(p => String(p.id) === String(id));
    if (!item) return;

    if (item.qty > 1) {
        item.qty--;
    } else {
        cart = cart.filter(p => String(p.id) !== String(id));
    }

    renderCart();
    saveCart();
}

function escapeCartHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function getCartItemImage(product) {
    if (typeof getSafeProductImage === "function") {
        return getSafeProductImage(product);
    }

    if (typeof sanitizeProductImage === "function") {
        return sanitizeProductImage(product?.img);
    }

    const value = String(product?.img || "").trim();
    return value || "product-placeholder.svg";
}

function buildCartFlags(product) {
    const parts = [];

    if (product?.is_hit) parts.push(`<span class="cart-badge cart-badge-hit">ХІТ</span>`);
    if (product?.is_sale) parts.push(`<span class="cart-badge cart-badge-sale">АКЦІЯ</span>`);
    if (product?.is_new) parts.push(`<span class="cart-badge cart-badge-new">НОВИНКА</span>`);

    if (!parts.length) return "";
    return `<div class="cart-badges">${parts.join("")}</div>`;
}

function ensureCartBadgeStyles() {
    if (document.getElementById("kids-room-cart-badge-styles")) return;

    const style = document.createElement("style");
    style.id = "kids-room-cart-badge-styles";
    style.textContent = `
    .cart-item{
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:12px;
        padding:12px;
        border-radius:14px;
        background:#fffdf9;
        border:1px solid #ece7df;
        margin-bottom:10px;
    }

    .cart-item-left{
        display:flex;
        align-items:flex-start;
        gap:12px;
        flex:1;
        min-width:0;
    }

    .cart-item-image{
        width:64px;
        height:64px;
        border-radius:12px;
        object-fit:cover;
        background:#f1f3f7;
        flex-shrink:0;
        border:1px solid #ece7df;
        display:block;
    }

    .cart-item-main{
        min-width:0;
        flex:1;
    }

    .cart-item-name{
        font-weight:800;
        color:#243041;
        line-height:1.4;
        margin-bottom:6px;
    }

    .cart-item-price{
        color:#6f7b8c;
        line-height:1.5;
        font-size:14px;
    }

    .cart-badges{
        display:flex;
        flex-wrap:wrap;
        gap:6px;
        margin-bottom:8px;
    }

    .cart-badge{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        padding:6px 10px;
        border-radius:999px;
        font-size:11px;
        font-weight:800;
        line-height:1;
    }

    .cart-badge-hit{
        background:#fff1e6;
        color:#ca6200;
    }

    .cart-badge-sale{
        background:#fff0f0;
        color:#c64c4c;
    }

    .cart-badge-new{
        background:#edf8ff;
        color:#23628d;
    }

    .cart-item-controls{
        display:flex;
        align-items:center;
        gap:8px;
        white-space:nowrap;
        font-weight:800;
        color:#243041;
    }

    .cart-item-controls button{
        width:32px;
        height:32px;
        border:none;
        border-radius:10px;
        background:#f1f3f6;
        color:#243041;
        font-size:18px;
        cursor:pointer;
        font-weight:800;
    }
    `;
    document.head.appendChild(style);
}

function renderCart() {
    const items = document.getElementById("cart-items");
    const count = document.getElementById("cart-count");
    const total = document.getElementById("total");

    if (!items || !count || !total) return;

    ensureCartBadgeStyles();
    syncCartWithProducts();

    items.innerHTML = "";

    let sum = 0;
    let qty = 0;

    cart.forEach(p => {
        sum += Number(p.price || 0) * Number(p.qty || 0);
        qty += Number(p.qty || 0);

        const image = getCartItemImage(p);

        items.innerHTML += `
        <div class="cart-item">
            <div class="cart-item-left">
                <img
                    class="cart-item-image"
                    src="${escapeCartHtml(image)}"
                    alt="${escapeCartHtml(p.name)}"
                    onerror="this.onerror=null;this.src='product-placeholder.svg'"
                >
                <div class="cart-item-main">
                    ${buildCartFlags(p)}
                    <div class="cart-item-name">${escapeCartHtml(p.name)}</div>
                    <div class="cart-item-price">${Number(p.price || 0)} грн</div>
                </div>
            </div>
            <div class="cart-item-controls">
                <button type="button" onclick="cartMinus('${escapeCartHtml(p.id)}')">−</button>
                <span>${Number(p.qty || 0)}</span>
                <button type="button" onclick="cartPlus('${escapeCartHtml(p.id)}')">+</button>
            </div>
        </div>
        `;
    });

    count.innerText = qty;
    total.innerText = "Разом: " + sum + " грн";
    window.dispatchEvent(new CustomEvent("cart:updated", { detail: cart }));
}

function checkout() {
    if (cart.length === 0) {
        alert("Кошик порожній");
        return;
    }

    const modal = document.getElementById("checkout-modal");
    if (!modal) return;

    modal.classList.add("open");
    handleDeliveryTypeChange();
}

function closeCheckoutModal() {
    const modal = document.getElementById("checkout-modal");
    if (!modal) return;

    modal.classList.remove("open");
}

function handleDeliveryTypeChange() {
    const deliveryEl = document.getElementById("order-delivery");
    if (!deliveryEl) return;

    const delivery = deliveryEl.value;

    const npCityWrap = document.getElementById("np-city-wrap");
    const npWarehouseWrap = document.getElementById("np-warehouse-wrap");
    const ukrWrap = document.getElementById("ukrposhta-wrap");

    if (!npCityWrap || !npWarehouseWrap || !ukrWrap) return;

    if (delivery === "Нова пошта") {
        npCityWrap.style.display = "block";
        npWarehouseWrap.style.display = "block";
        ukrWrap.style.display = "none";
    } else {
        npCityWrap.style.display = "none";
        npWarehouseWrap.style.display = "none";
        ukrWrap.style.display = "block";
    }
}

async function callNP(model, method, props) {
    const res = await fetch(NOVA_POSHTA_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            apiKey: NOVA_POSHTA_API_KEY,
            modelName: model,
            calledMethod: method,
            methodProperties: props
        })
    });

    const data = await res.json();

    if (!data.success) {
        console.error("Nova Poshta API error:", data);
        return [];
    }

    return data.data || [];
}

async function loadWarehouses(cityRef) {
    return await callNP("AddressGeneral", "getWarehouses", { CityRef: cityRef });
}

async function handleCityInput() {
    const input = document.getElementById("order-city");
    const list = document.getElementById("city-suggestions");
    if (!input || !list) return;

    const val = input.value.trim();

    selectedCity = null;
    resetWarehouses("Оберіть відділення");

    if (val.length < 2) {
        list.style.display = "none";
        list.innerHTML = "";
        return;
    }

    const cities = await callNP("AddressGeneral", "searchSettlements", { CityName: val, Limit: 10 });

    list.innerHTML = "";

    if (!cities.length || !cities[0].Addresses?.length) {
        list.style.display = "none";
        return;
    }

    cities[0].Addresses.forEach(city => {
        const item = document.createElement("div");
        item.className = "np-suggestion-item";
        item.innerText = city.Present;
        item.onclick = async () => {
            input.value = city.Present;
            list.style.display = "none";
            list.innerHTML = "";

            selectedCity = {
                ref: city.Ref,
                name: city.Present
            };

            const warehouses = await loadWarehouses(city.Ref);
            fillWarehouses(warehouses);
        };
        list.appendChild(item);
    });

    list.style.display = "block";
}

function resetWarehouses(placeholder = "Спочатку оберіть місто") {
    const select = document.getElementById("order-address");
    if (!select) return;

    select.innerHTML = `<option value="">${placeholder}</option>`;
}

function fillWarehouses(warehouses) {
    const select = document.getElementById("order-address");
    if (!select) return;

    resetWarehouses("Оберіть відділення");

    warehouses.forEach(w => {
        const text = w.Description || w.ShortAddress || "Відділення";
        const option = document.createElement("option");
        option.value = text;
        option.innerText = text;
        select.appendChild(option);
    });
}

async function submitCheckout() {
    const name = document.getElementById("order-name")?.value.trim() || "";
    const surname = document.getElementById("order-surname")?.value.trim() || "";
    const phone = document.getElementById("order-phone")?.value.trim() || "";
    const delivery = document.getElementById("order-delivery")?.value || "Нова пошта";

    let city = "";
    let address = "";

    if (!name || !surname || !phone) {
        alert("Заповніть всі поля");
        return;
    }

    if (delivery === "Нова пошта") {
        city = document.getElementById("order-city")?.value.trim() || "";
        address = document.getElementById("order-address")?.value || "";

        if (!city || !selectedCity) {
            alert("Оберіть місто зі списку");
            return;
        }

        if (!address) {
            alert("Оберіть відділення");
            return;
        }
    }

    if (delivery === "Укрпошта") {
        city = document.getElementById("order-city-manual")?.value.trim() || "";
        const index = document.getElementById("order-index")?.value.trim() || "";

        if (!city) {
            alert("Вкажіть місто");
            return;
        }

        if (!index) {
            alert("Вкажіть поштовий індекс");
            return;
        }

        address = "Індекс: " + index;
    }

    const order = {
        customer_first_name: name,
        customer_last_name: surname,
        name: `${name} ${surname}`.trim(),
        phone,
        city,
        delivery,
        address,
        items: cart.map(item => normalizeCartItem(item, item.qty)),
        total: cart.reduce((s, p) => s + Number(p.price || 0) * Number(p.qty || 0), 0),
        status: "Новий",
        status_group: "new",
        operator_comment: "",
        day_bucket: 0,
        source: "website",
        manager_comment: ""
    };

    try {
        const crmSaver = window.saveOrderCRM;

        if (typeof crmSaver !== "function") {
            throw new Error("Функція saveOrderCRM не завантажилась. Замініть файл crm.js на нову версію і оновіть сайт.");
        }

        const savedOrder = await crmSaver(order);

        cart = [];
        saveCart();
        renderCart();

        const fieldsToClear = [
            "order-name",
            "order-surname",
            "order-phone",
            "order-city",
            "order-city-manual",
            "order-index"
        ];

        fieldsToClear.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });

        resetWarehouses("Оберіть відділення");
        selectedCity = null;

        closeCheckoutModal();
        closeCart();

        openSuccessModal(getCheckoutSuccessOrderNumber(savedOrder));
    } catch (error) {
        console.error(error);
        alert("Помилка CRM: " + error.message);
    }
}

function showToast(text) {
    const t = document.createElement("div");

    t.style.position = "fixed";
    t.style.bottom = "20px";
    t.style.right = "20px";
    t.style.background = "#ff6600";
    t.style.color = "white";
    t.style.padding = "12px 20px";
    t.style.borderRadius = "10px";
    t.style.zIndex = "9999";

    t.innerText = text;

    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
}

function clearCart() {
    cart = [];
    saveCart();
    renderCart();
}

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent("cart:updated", { detail: cart }));
}

renderCart();

document.addEventListener("DOMContentLoaded", () => {
    const cityInput = document.getElementById("order-city");
    const list = document.getElementById("city-suggestions");

    handleDeliveryTypeChange();

    if (cityInput) {
        cityInput.addEventListener("input", handleCityInput);
    }

    if (cityInput && list) {
        cityInput.addEventListener("blur", () => {
            setTimeout(() => {
                list.style.display = "none";
            }, 200);
        });

        cityInput.addEventListener("focus", () => {
            if (list.innerHTML.trim() !== "") {
                list.style.display = "block";
            }
        });
    }
});

window.addEventListener("products:updated", () => {
    renderCart();
});

window.addEventListener("storage", event => {
    if (event.key === "cart") {
        cart = JSON.parse(localStorage.getItem("cart") || "[]");
        renderCart();
    }
    if (event.key === "products") {
        renderCart();
    }
});

window.toggleCart = toggleCart;
window.closeCart = closeCart;
window.addToCart = addToCart;
window.cartPlus = cartPlus;
window.cartMinus = cartMinus;
window.renderCart = renderCart;
window.checkout = checkout;
window.closeCheckoutModal = closeCheckoutModal;
window.handleDeliveryTypeChange = handleDeliveryTypeChange;
window.handleCityInput = handleCityInput;
window.submitCheckout = submitCheckout;
window.closeSuccessModal = closeSuccessModal;
window.clearCart = clearCart;
window.getCartItemImage = getCartItemImage;