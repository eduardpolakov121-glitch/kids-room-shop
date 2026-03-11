let cart = JSON.parse(localStorage.getItem("cart")) || [];

const NOVA_POSHTA_API_KEY = "0cddc3bd30e2e4de2f2ce8f46313a168";
const NOVA_POSHTA_API_URL = "https://api.novaposhta.ua/v2.0/json/";

let selectedCity = null;
let lastCheckoutOrderNumber = "";

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

    const willOpen = !cartEl.classList.contains("open");
    cartEl.classList.toggle("open", willOpen);
    overlay.classList.toggle("active", willOpen);
}

function closeCart() {
    const cartEl = document.getElementById("cart");
    const overlay = document.getElementById("cart-overlay");
    if (!cartEl || !overlay) return;

    cartEl.classList.remove("open");
    overlay.classList.remove("active");
}

function getProductQtyInputValue(id) {
    const input = document.getElementById("qty-" + id);
    if (!input) return 1;

    const qty = parseInt(input.value || "1", 10);
    if (Number.isNaN(qty) || qty < 1) return 1;
    return qty;
}

function addToCart(id) {
    const qty = getProductQtyInputValue(id);
    const product = products.find(p => String(p.id) === String(id));
    if (!product) return;

    const item = cart.find(p => String(p.id) === String(id));

    if (item) {
        item.qty += qty;
        item.img = getCartItemImage(product);
    } else {
        cart.push({
            ...product,
            img: getCartItemImage(product),
            qty
        });
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

function getCartTotals() {
    const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
    const qty = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    const delivery = subtotal >= 1000 || subtotal === 0 ? 0 : 120;
    const total = subtotal + delivery;

    return { subtotal, qty, delivery, total };
}

function renderCartProgress(subtotal) {
    const progress = document.getElementById("cart-progress");
    if (!progress) return;

    if (subtotal >= 1000) {
        progress.innerHTML = `✅ У вас вже <strong>безкоштовна доставка</strong>`;
        return;
    }

    const remain = 1000 - subtotal;
    progress.innerHTML = `🎁 Додайте ще <strong>${remain} грн</strong> для безкоштовної доставки`;
}

function renderCartSummary(subtotal, delivery, total) {
    const summary = document.getElementById("cart-summary");
    if (!summary) return;

    summary.innerHTML = `
        <div class="cart-summary-box">
            <div class="cart-summary-row">
                <span>Товари</span>
                <strong>${subtotal} грн</strong>
            </div>
            <div class="cart-summary-row">
                <span>Доставка</span>
                <strong>${delivery === 0 ? "Безкоштовно" : delivery + " грн"}</strong>
            </div>
            <div class="cart-summary-total">
                До сплати <span>${total} грн</span>
            </div>
        </div>
    `;
}

function renderCart() {
    const items = document.getElementById("cart-items");
    const count = document.getElementById("cart-count");
    if (!items || !count) return;

    items.innerHTML = "";

    const { subtotal, qty, delivery, total } = getCartTotals();

    cart.forEach(p => {
        const image = getCartItemImage(p);
        const itemTotal = Number(p.price || 0) * Number(p.qty || 0);

        items.innerHTML += `
        <div class="cart-item">
            <div style="display:flex;align-items:flex-start;gap:10px;min-width:0;">
                <img
                    src="${image}"
                    alt="${p.name}"
                    style="width:64px;height:64px;object-fit:cover;border-radius:14px;background:#f3f3f3;flex-shrink:0;"
                    onerror="this.onerror=null;this.src='product-placeholder.svg'"
                >
                <div style="min-width:0;">
                    <div class="cart-item-title">${p.name}</div>
                    <div class="cart-item-sub">${p.price} грн × ${p.qty}</div>
                </div>
            </div>

            <div class="cart-item-side">
                <div class="cart-item-qty">
                    <button onclick="cartMinus('${p.id}')">−</button>
                    <span>${p.qty}</span>
                    <button onclick="cartPlus('${p.id}')">+</button>
                </div>
                <div class="cart-item-total">${itemTotal} грн</div>
            </div>
        </div>
        `;
    });

    if (!cart.length) {
        items.innerHTML = `
            <div style="padding:18px;border:1px dashed #e6dceb;border-radius:18px;background:#fff;text-align:center;color:#748097;">
                Кошик поки порожній
            </div>
        `;
    }

    count.innerText = qty;

    renderCartProgress(subtotal);
    renderCartSummary(subtotal, delivery, total);
    renderCheckoutSummary();
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
    renderCheckoutSummary();
}

function closeCheckoutModal() {
    const modal = document.getElementById("checkout-modal");
    if (!modal) return;

    modal.classList.remove("open");
}

function renderCheckoutSummary() {
    const box = document.getElementById("checkout-summary-box");
    if (!box) return;

    const { subtotal, delivery, total } = getCartTotals();

    box.innerHTML = `
        <h3>Ваше замовлення</h3>

        ${cart.map(item => `
            <div class="checkout-summary-item">
                <span>${item.name} × ${item.qty}</span>
                <strong>${Number(item.price || 0) * Number(item.qty || 0)} грн</strong>
            </div>
        `).join("")}

        <div class="checkout-summary-total">
            <div>
                <div style="font-size:13px;color:#748097;font-weight:700;">Разом до сплати</div>
                <span>${total} грн</span>
            </div>
            <div style="text-align:right;font-size:14px;color:#748097;font-weight:700;">
                ${delivery === 0 ? "Доставка безкоштовна" : "Доставка " + delivery + " грн"}
            </div>
        </div>

        <div class="checkout-summary-note">
            ${subtotal >= 1000
                ? "🎁 Ваше замовлення вже бере участь у безкоштовній доставці."
                : "Додайте ще " + (1000 - subtotal) + " грн для безкоштовної доставки."}
        </div>
    `;
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

    const totals = getCartTotals();

    const order = {
        customer_first_name: name,
        customer_last_name: surname,
        name: `${name} ${surname}`.trim(),
        phone,
        city,
        delivery,
        address,
        items: cart,
        total: totals.total,
        subtotal: totals.subtotal,
        delivery_price: totals.delivery,
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
    t.style.background = "#2e3550";
    t.style.color = "white";
    t.style.padding = "12px 20px";
    t.style.borderRadius = "12px";
    t.style.zIndex = "9999";
    t.style.boxShadow = "0 10px 24px rgba(0,0,0,0.18)";
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
    handleDeliveryTypeChange();

    const cityInput = document.getElementById("order-city");
    const list = document.getElementById("city-suggestions");

    if (cityInput && list) {
        cityInput.addEventListener("input", handleCityInput);

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