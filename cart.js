let cart = JSON.parse(localStorage.getItem("cart")) || [];

const NOVA_POSHTA_API_KEY = "0cddc3bd30e2e4de2f2ce8f46313a168";
const NOVA_POSHTA_API_URL = "https://api.novaposhta.ua/v2.0/json/";

let selectedCity = null;
let lastCheckoutOrderNumber = "";

function getCheckoutSuccessOrderNumber(payload) {
    const rawId = Array.isArray(payload) ? payload[0]?.id : payload?.id;
    const rawString = String(rawId || "").trim();
    const digits = rawString.replace(/\D/g, "");

    if (digits.length >= 5) {
        return "#" + digits.slice(-6);
    }

    if (rawString) {
        return "#" + rawString.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
    }

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
    document.getElementById("cart").classList.toggle("open");
    document.getElementById("cart-overlay").classList.toggle("active");
}

function closeCart() {
    document.getElementById("cart").classList.remove("open");
    document.getElementById("cart-overlay").classList.remove("active");
}

function addToCart(id) {
    refreshProductsFromStorage();

    const qtyInput = document.getElementById("qty-" + id);
    let qty = parseInt(qtyInput ? qtyInput.value : 1, 10);

    if (isNaN(qty) || qty < 1) qty = 1;

    const product = products.find(p => p.id === id);
    if (!product) return;

    const item = cart.find(p => p.id === id);

    if (item) {
        item.qty += qty;
        item.is_hit = !!product.is_hit;
        item.is_sale = !!product.is_sale;
        item.is_new = !!product.is_new;
        item.img = product.img;
        item.old = product.old;
        item.price = product.price;
        item.name = product.name;
        item.category = product.category;
        item.description = product.description;
    } else {
        cart.push({ ...product, qty });
    }

    renderCart();
    saveCart();
    renderCheckoutSummary();
    showToast("Товар додано в кошик");
}

function cartPlus(id) {
    const item = cart.find(p => p.id === id);
    if (!item) return;

    item.qty++;
    renderCart();
    saveCart();
    renderCheckoutSummary();
}

function cartMinus(id) {
    const item = cart.find(p => p.id === id);
    if (!item) return;

    if (item.qty > 1) {
        item.qty--;
    } else {
        cart = cart.filter(p => p.id !== id);
    }

    renderCart();
    saveCart();
    renderCheckoutSummary();
}

function escapeCartHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function buildCartFlags(product) {
    const parts = [];

    if (product?.is_hit) {
        parts.push(`<span class="cart-badge cart-badge-hit">ХІТ</span>`);
    }

    if (product?.is_sale) {
        parts.push(`<span class="cart-badge cart-badge-sale">АКЦІЯ</span>`);
    }

    if (product?.is_new) {
        parts.push(`<span class="cart-badge cart-badge-new">НОВИНКА</span>`);
    }

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

    .cart-badges,
    .checkout-summary-badges{
        display:flex;
        flex-wrap:wrap;
        gap:6px;
        margin-bottom:8px;
    }

    .cart-badge,
    .checkout-summary-badge{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        padding:6px 10px;
        border-radius:999px;
        font-size:11px;
        font-weight:800;
        line-height:1;
    }

    .cart-badge-hit,
    .checkout-summary-badge-hit{
        background:#fff1e6;
        color:#ca6200;
    }

    .cart-badge-sale,
    .checkout-summary-badge-sale{
        background:#fff0f0;
        color:#c64c4c;
    }

    .cart-badge-new,
    .checkout-summary-badge-new{
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

    .checkout-summary-box{
        margin:14px 0;
        padding:14px;
        border-radius:16px;
        background:#fffdf9;
        border:1px solid #ece7df;
    }

    .checkout-summary-title{
        font-size:15px;
        font-weight:800;
        color:#243041;
        margin-bottom:10px;
    }

    .checkout-summary-list{
        display:flex;
        flex-direction:column;
        gap:10px;
        max-height:220px;
        overflow:auto;
    }

    .checkout-summary-item{
        padding:10px 12px;
        border-radius:12px;
        background:#fafbfd;
        border:1px solid #eef1f5;
    }

    .checkout-summary-name{
        font-weight:800;
        color:#243041;
        line-height:1.4;
        margin-bottom:6px;
    }

    .checkout-summary-meta{
        color:#6f7b8c;
        font-size:14px;
        line-height:1.5;
    }

    .checkout-summary-total{
        margin-top:12px;
        padding-top:10px;
        border-top:1px solid #ece7df;
        font-weight:800;
        color:#243041;
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
    items.innerHTML = "";

    let sum = 0;
    let qty = 0;

    cart.forEach(p => {
        sum += p.price * p.qty;
        qty += p.qty;

        items.innerHTML += `
        <div class="cart-item">
            <div class="cart-item-main">
                ${buildCartFlags(p)}
                <div class="cart-item-name">${escapeCartHtml(p.name)}</div>
                <div class="cart-item-price">${Number(p.price || 0)} грн</div>
            </div>
            <div class="cart-item-controls">
                <button onclick="cartMinus('${escapeCartHtml(p.id)}')">−</button>
                <span>${p.qty}</span>
                <button onclick="cartPlus('${escapeCartHtml(p.id)}')">+</button>
            </div>
        </div>
        `;
    });

    count.innerText = qty;
    total.innerText = "Разом: " + sum + " грн";
    window.dispatchEvent(new CustomEvent("cart:updated", { detail: cart }));
}

function buildCheckoutSummaryFlags(product) {
    const parts = [];

    if (product?.is_hit) {
        parts.push(`<span class="checkout-summary-badge checkout-summary-badge-hit">ХІТ</span>`);
    }

    if (product?.is_sale) {
        parts.push(`<span class="checkout-summary-badge checkout-summary-badge-sale">АКЦІЯ</span>`);
    }

    if (product?.is_new) {
        parts.push(`<span class="checkout-summary-badge checkout-summary-badge-new">НОВИНКА</span>`);
    }

    if (!parts.length) return "";

    return `<div class="checkout-summary-badges">${parts.join("")}</div>`;
}

function ensureCheckoutSummaryRoot() {
    const modalBox = document.querySelector("#checkout-modal .checkout-box");
    if (!modalBox) return null;

    let root = document.getElementById("checkout-summary-box");
    if (root) return root;

    root = document.createElement("div");
    root.id = "checkout-summary-box";
    root.className = "checkout-summary-box";

    const actions = modalBox.querySelector(".checkout-actions");
    if (actions) {
        modalBox.insertBefore(root, actions);
    } else {
        modalBox.appendChild(root);
    }

    return root;
}

function renderCheckoutSummary() {
    ensureCartBadgeStyles();

    const root = ensureCheckoutSummaryRoot();
    if (!root) return;

    if (!Array.isArray(cart) || !cart.length) {
        root.innerHTML = `
            <div class="checkout-summary-title">Ваше замовлення</div>
            <div class="checkout-summary-meta">Кошик порожній</div>
        `;
        return;
    }

    const itemsHtml = cart.map(item => `
        <div class="checkout-summary-item">
            ${buildCheckoutSummaryFlags(item)}
            <div class="checkout-summary-name">${escapeCartHtml(item.name)}</div>
            <div class="checkout-summary-meta">${Number(item.qty || 1)} × ${Number(item.price || 0)} грн</div>
        </div>
    `).join("");

    const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);

    root.innerHTML = `
        <div class="checkout-summary-title">Ваше замовлення</div>
        <div class="checkout-summary-list">${itemsHtml}</div>
        <div class="checkout-summary-total">Разом: ${total} грн</div>
    `;
}

function checkout() {
    if (cart.length === 0) {
        alert("Кошик порожній");
        return;
    }

    document.getElementById("checkout-modal").classList.add("open");
    handleDeliveryTypeChange();
    renderCheckoutSummary();
}

function closeCheckoutModal() {
    document.getElementById("checkout-modal").classList.remove("open");
}

function handleDeliveryTypeChange() {
    const delivery = document.getElementById("order-delivery").value;

    const npCityWrap = document.getElementById("np-city-wrap");
    const npWarehouseWrap = document.getElementById("np-warehouse-wrap");
    const ukrWrap = document.getElementById("ukrposhta-wrap");

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
        headers: {
            "Content-Type": "application/json"
        },
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
    const val = input.value.trim();

    selectedCity = null;
    resetWarehouses("Оберіть відділення");

    if (val.length < 2) {
        list.style.display = "none";
        list.innerHTML = "";
        return;
    }

    const result = await callNP("Address", "searchSettlements", {
        CityName: val,
        Limit: 20
    });

    list.innerHTML = "";

    if (!result.length) {
        list.style.display = "none";
        return;
    }

    list.style.display = "block";

    result.forEach(item => {
        if (!item.Addresses || !item.Addresses.length) return;

        item.Addresses.forEach(city => {
            const div = document.createElement("div");
            div.className = "np-suggestion-item";
            div.textContent = city.Present;

            div.onclick = async () => {
                input.value = city.Present;
                selectedCity = {
                    ref: city.Ref,
                    name: city.Present
                };

                list.style.display = "none";
                list.innerHTML = "";

                const warehouses = await loadWarehouses(city.Ref);
                fillWarehouses(warehouses);
            };

            list.appendChild(div);
        });
    });
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
    const name = document.getElementById("order-name").value.trim();
    const surname = document.getElementById("order-surname").value.trim();
    const phone = document.getElementById("order-phone").value.trim();
    const delivery = document.getElementById("order-delivery").value;

    let city = "";
    let address = "";

    if (!name || !surname || !phone) {
        alert("Заповніть всі поля");
        return;
    }

    if (delivery === "Нова пошта") {
        city = document.getElementById("order-city").value.trim();
        address = document.getElementById("order-address").value;

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
        city = document.getElementById("order-city-manual").value.trim();
        const index = document.getElementById("order-index").value.trim();

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
        items: cart,
        total: cart.reduce((s, p) => s + p.price * p.qty, 0),
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
        renderCheckoutSummary();

        document.getElementById("order-name").value = "";
        document.getElementById("order-surname").value = "";
        document.getElementById("order-phone").value = "";
        document.getElementById("order-city").value = "";
        document.getElementById("order-city-manual").value = "";
        document.getElementById("order-index").value = "";

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
    renderCheckoutSummary();
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
    renderCheckoutSummary();

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