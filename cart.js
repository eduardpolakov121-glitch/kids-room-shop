let cart = JSON.parse(localStorage.getItem("cart")) || [];

const NOVA_POSHTA_API_KEY = "0cddc3bd30e2e4de2f2ce8f46313a168";
const NOVA_POSHTA_API_URL = "https://api.novaposhta.ua/v2.0/json/";

let selectedCity = null;
let lastCheckoutOrderNumber = "";

/* =========================
   ДОП. ХЕЛПЕРЫ
========================= */

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

function escapeCartHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function getCheckoutSuccessOrderNumber(payload) {
    const rawId = Array.isArray(payload) ? payload[0]?.id : payload?.id;
    const rawString = String(rawId || "").trim();
    const digits = rawString.replace(/\D/g, "");

    if (digits.length >= 5) return "#" + digits.slice(-6);
    if (rawString) return "#" + rawString.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();

    return "#KR" + String(Date.now()).slice(-6);
}

function emitCartUpdated() {
    window.dispatchEvent(new CustomEvent("cart:updated", { detail: cart }));
}

/* =========================
   УСПЕШНОЕ ОКНО
========================= */

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

/* =========================
   АНИМАЦИЯ КОРЗИНЫ
========================= */

function animateCartButton() {
    const cartButton = document.querySelector(".cart-button");
    if (!cartButton || !cartButton.animate) return;

    cartButton.animate([
        { transform: "scale(1)" },
        { transform: "scale(1.18)" },
        { transform: "scale(0.96)" },
        { transform: "scale(1.08)" },
        { transform: "scale(1)" }
    ], {
        duration: 520,
        easing: "ease-out"
    });
}

function findProductImageById(id) {
    const cardImg = document.querySelector(`#prod-${CSS.escape(String(id))} img`);
    if (cardImg) return cardImg;

    const homeImg = document.querySelector(`#home-hits-grid img, #home-sales-grid img, #home-new-grid img`);
    if (homeImg) return homeImg;

    const productPageImg = document.querySelector("#product-main-image");
    if (productPageImg) return productPageImg;

    return null;
}

function flyToCart(id) {
    const cartButton = document.querySelector(".cart-button");
    const sourceImg = findProductImageById(id);

    if (!cartButton) return;

    if (!sourceImg) {
        animateCartButton();
        return;
    }

    const start = sourceImg.getBoundingClientRect();
    const end = cartButton.getBoundingClientRect();

    if (!start.width || !start.height) {
        animateCartButton();
        return;
    }

    const clone = sourceImg.cloneNode(true);
    clone.style.position = "fixed";
    clone.style.left = start.left + "px";
    clone.style.top = start.top + "px";
    clone.style.width = start.width + "px";
    clone.style.height = start.height + "px";
    clone.style.borderRadius = "12px";
    clone.style.objectFit = "cover";
    clone.style.zIndex = "99999";
    clone.style.pointerEvents = "none";
    clone.style.transition = "transform 0.8s cubic-bezier(.22,.61,.36,1), opacity 0.8s ease, left 0.8s cubic-bezier(.22,.61,.36,1), top 0.8s cubic-bezier(.22,.61,.36,1), width 0.8s ease, height 0.8s ease";
    clone.style.boxShadow = "0 16px 40px rgba(0,0,0,0.22)";
    document.body.appendChild(clone);

    const endLeft = end.left + end.width / 2 - 18;
    const endTop = end.top + end.height / 2 - 18;

    requestAnimationFrame(() => {
        clone.style.left = endLeft + "px";
        clone.style.top = endTop + "px";
        clone.style.width = "36px";
        clone.style.height = "36px";
        clone.style.opacity = "0.25";
        clone.style.transform = "scale(0.25) rotate(16deg)";
    });

    setTimeout(() => {
        clone.remove();
        animateCartButton();
    }, 820);
}

/* =========================
   КОРЗИНА
========================= */

function toggleCart() {
    const cartEl = document.getElementById("cart");
    const overlay = document.getElementById("cart-overlay");

    if (cartEl) cartEl.classList.toggle("open");
    if (overlay) overlay.classList.toggle("active");
}

function closeCart() {
    const cartEl = document.getElementById("cart");
    const overlay = document.getElementById("cart-overlay");

    if (cartEl) cartEl.classList.remove("open");
    if (overlay) overlay.classList.remove("active");
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
        item.img = getCartItemImage(product);
    } else {
        cart.push({
            ...product,
            img: getCartItemImage(product),
            qty
        });
    }

    flyToCart(id);
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

function removeCartItem(id) {
    cart = cart.filter(p => String(p.id) !== String(id));
    renderCart();
    saveCart();
}

function renderCart() {
    const items = document.getElementById("cart-items");
    const count = document.getElementById("cart-count");
    const total = document.getElementById("total");

    if (!items || !count || !total) return;

    items.innerHTML = "";

    let sum = 0;
    let qty = 0;

    if (!cart.length) {
        items.innerHTML = `
            <div class="cart-empty-state">
                <div class="cart-empty-icon">🛒</div>
                <div class="cart-empty-title">Кошик порожній</div>
                <div class="cart-empty-text">Додай товари, щоб оформити замовлення.</div>
            </div>
        `;
    }

    cart.forEach(p => {
        const itemSum = Number(p.price || 0) * Number(p.qty || 0);
        const image = getCartItemImage(p);

        sum += itemSum;
        qty += Number(p.qty || 0);

        items.innerHTML += `
        <div class="cart-item">
            <div class="cart-item-left">
                <img
                    src="${escapeCartHtml(image)}"
                    alt="${escapeCartHtml(p.name)}"
                    class="cart-item-image"
                    onerror="this.onerror=null;this.src='product-placeholder.svg'"
                >
                <div class="cart-item-info">
                    <div class="cart-item-name">${escapeCartHtml(p.name)}</div>
                    <div class="cart-item-price">${Number(p.price || 0)} грн</div>
                    <div class="cart-item-subtotal">Сума: ${itemSum} грн</div>
                </div>
            </div>

            <div class="cart-item-right">
                <div class="cart-qty-control">
                    <button type="button" class="cart-qty-btn" onclick="cartMinus('${escapeCartHtml(p.id)}')">−</button>
                    <span class="cart-qty-value">${Number(p.qty || 0)}</span>
                    <button type="button" class="cart-qty-btn" onclick="cartPlus('${escapeCartHtml(p.id)}')">+</button>
                </div>

                <button type="button" class="cart-remove-btn" onclick="removeCartItem('${escapeCartHtml(p.id)}')">
                    Видалити
                </button>
            </div>
        </div>
        `;
    });

    count.innerText = qty;
    total.innerText = "Разом: " + sum + " грн";

    emitCartUpdated();
}

/* =========================
   ОФОРМЛЕНИЕ
========================= */

function checkout() {
    if (cart.length === 0) {
        alert("Кошик порожній");
        return;
    }

    const modal = document.getElementById("checkout-modal");
    if (modal) modal.classList.add("open");
    handleDeliveryTypeChange();
}

function closeCheckoutModal() {
    const modal = document.getElementById("checkout-modal");
    if (modal) modal.classList.remove("open");
}

/* =========================
   ДОСТАВКА
========================= */

function handleDeliveryTypeChange() {
    const deliveryEl = document.getElementById("order-delivery");
    if (!deliveryEl) return;

    const delivery = deliveryEl.value;

    const npCityWrap = document.getElementById("np-city-wrap");
    const npWarehouseWrap = document.getElementById("np-warehouse-wrap");
    const ukrWrap = document.getElementById("ukrposhta-wrap");

    if (delivery === "Нова пошта") {
        if (npCityWrap) npCityWrap.style.display = "block";
        if (npWarehouseWrap) npWarehouseWrap.style.display = "block";
        if (ukrWrap) ukrWrap.style.display = "none";
    } else {
        if (npCityWrap) npCityWrap.style.display = "none";
        if (npWarehouseWrap) npWarehouseWrap.style.display = "none";
        if (ukrWrap) ukrWrap.style.display = "block";
    }
}

/* =========================
   NOVA POSHTA API
========================= */

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

/* =========================
   ГОРОДА НП
========================= */

async function handleCityInput() {
    const input = document.getElementById("order-city");
    const list = document.getElementById("city-suggestions");
    const val = input ? input.value.trim() : "";

    selectedCity = null;
    resetWarehouses("Оберіть відділення");

    if (!list) return;

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

    if (!Array.isArray(result) || !result.length) {
        list.style.display = "none";
        return;
    }

    const first = result[0];
    const addresses = Array.isArray(first?.Addresses) ? first.Addresses : [];

    if (!addresses.length) {
        list.style.display = "none";
        return;
    }

    list.style.display = "block";

    addresses.forEach(city => {
        const cityName = city.Present || city.MainDescription || city.Description || "Місто";
        const cityRefForWarehouses = city.DeliveryCity || city.Ref || "";

        if (!cityRefForWarehouses) return;

        const div = document.createElement("div");
        div.className = "np-suggestion-item";
        div.innerText = cityName;

        div.onclick = async () => {
            if (input) input.value = cityName;

            selectedCity = {
                name: cityName,
                ref: cityRefForWarehouses
            };

            list.style.display = "none";
            list.innerHTML = "";

            await fillWarehouses(cityRefForWarehouses);
        };

        list.appendChild(div);
    });
}

/* =========================
   ОТДЕЛЕНИЯ НП
========================= */

function resetWarehouses(text = "Спочатку оберіть місто") {
    const select = document.getElementById("order-address");
    if (!select) return;

    select.innerHTML = `<option value="">${escapeCartHtml(text)}</option>`;
    select.disabled = false;
}

async function fillWarehouses(cityRef) {
    const select = document.getElementById("order-address");
    if (!select) return;

    resetWarehouses("Завантаження...");

    const warehouses = await loadWarehouses(cityRef);

    if (!Array.isArray(warehouses) || !warehouses.length) {
        resetWarehouses("Немає відділень");
        return;
    }

    select.innerHTML = `<option value="">Оберіть відділення</option>`;

    warehouses.forEach(w => {
        const text = w.Description || w.ShortAddress || "Відділення";
        const option = document.createElement("option");
        option.value = text;
        option.innerText = text;
        select.appendChild(option);
    });
}

/* =========================
   ОТПРАВКА
========================= */

async function submitCheckout() {
    const name = document.getElementById("order-name")?.value.trim() || "";
    const surname = document.getElementById("order-surname")?.value.trim() || "";
    const phone = document.getElementById("order-phone")?.value.trim() || "";
    const delivery = document.getElementById("order-delivery")?.value || "";

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
        items: cart,
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

        if (document.getElementById("order-name")) document.getElementById("order-name").value = "";
        if (document.getElementById("order-surname")) document.getElementById("order-surname").value = "";
        if (document.getElementById("order-phone")) document.getElementById("order-phone").value = "";
        if (document.getElementById("order-city")) document.getElementById("order-city").value = "";
        if (document.getElementById("order-city-manual")) document.getElementById("order-city-manual").value = "";
        if (document.getElementById("order-index")) document.getElementById("order-index").value = "";

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

/* =========================
   TOAST
========================= */

function showToast(text) {
    const t = document.createElement("div");
    t.className = "cart-toast show";
    t.innerText = text;

    document.body.appendChild(t);

    setTimeout(() => {
        t.classList.remove("show");
        setTimeout(() => t.remove(), 250);
    }, 1800);
}

/* =========================
   SAVE / CLEAR
========================= */

function clearCart() {
    cart = [];
    saveCart();
    renderCart();
}

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    emitCartUpdated();
}

/* =========================
   INIT
========================= */

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

    const openCartAfterReturn = localStorage.getItem("kids_room_open_cart_after_return");
    if (openCartAfterReturn === "true") {
        localStorage.removeItem("kids_room_open_cart_after_return");
        setTimeout(() => toggleCart(), 120);
    }
});

/* =========================
   EXPORTS
========================= */

window.toggleCart = toggleCart;
window.closeCart = closeCart;
window.addToCart = addToCart;
window.cartPlus = cartPlus;
window.cartMinus = cartMinus;
window.removeCartItem = removeCartItem;
window.renderCart = renderCart;
window.checkout = checkout;
window.closeCheckoutModal = closeCheckoutModal;
window.handleDeliveryTypeChange = handleDeliveryTypeChange;
window.handleCityInput = handleCityInput;
window.submitCheckout = submitCheckout;
window.closeSuccessModal = closeSuccessModal;
window.clearCart = clearCart;