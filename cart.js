let cart = JSON.parse(localStorage.getItem("cart")) || [];

const NOVA_POSHTA_API_KEY = "0cddc3bd30e2e4de2f2ce8f46313a168";
const NOVA_POSHTA_API_URL = "https://api.novaposhta.ua/v2.0/json/";

let selectedCity = null;
let lastCheckoutOrderNumber = "";

function normalizeCartQty(value) {
    const qty = parseInt(value || "1", 10);
    return Number.isNaN(qty) || qty < 1 ? 1 : qty;
}

function getCatalogProductById(id) {
    if (!Array.isArray(window.products)) return null;
    return window.products.find(item => String(item.id) === String(id)) || null;
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

    return normalizeCartQty(input.value);
}

function syncCartWithCatalogData() {
    if (!Array.isArray(cart)) {
        cart = [];
        return;
    }

    cart = cart.map(item => {
        const fresh = getCatalogProductById(item.id);

        if (!fresh) {
            return {
                ...item,
                qty: normalizeCartQty(item.qty),
                img: getCartItemImage(item)
            };
        }

        return {
            ...item,
            name: fresh.name,
            category: fresh.category,
            price: fresh.price,
            old: fresh.old,
            description: fresh.description,
            img: getCartItemImage(fresh),
            is_hit: !!fresh.is_hit,
            is_sale: !!fresh.is_sale,
            is_new: !!fresh.is_new,
            qty: normalizeCartQty(item.qty)
        };
    });
}

function addToCart(id) {
    const product = getCatalogProductById(id);

    if (!product) {
        showToast("Товар ще завантажується");
        return;
    }

    const qty = getProductQtyInputValue(id);
    const existingItem = cart.find(item => String(item.id) === String(id));

    if (existingItem) {
        existingItem.qty = normalizeCartQty(existingItem.qty) + qty;
        existingItem.name = product.name;
        existingItem.category = product.category;
        existingItem.price = product.price;
        existingItem.old = product.old;
        existingItem.description = product.description;
        existingItem.img = getCartItemImage(product);
        existingItem.is_hit = !!product.is_hit;
        existingItem.is_sale = !!product.is_sale;
        existingItem.is_new = !!product.is_new;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            category: product.category,
            price: product.price,
            old: product.old,
            description: product.description,
            img: getCartItemImage(product),
            is_hit: !!product.is_hit,
            is_sale: !!product.is_sale,
            is_new: !!product.is_new,
            qty
        });
    }

    saveCart();
    renderCart();
    showToast("Товар додано в кошик");
}

function cartPlus(id) {
    const item = cart.find(p => String(p.id) === String(id));
    if (!item) return;

    item.qty = normalizeCartQty(item.qty) + 1;
    saveCart();
    renderCart();
}

function cartMinus(id) {
    const item = cart.find(p => String(p.id) === String(id));
    if (!item) return;

    if (normalizeCartQty(item.qty) > 1) {
        item.qty = normalizeCartQty(item.qty) - 1;
    } else {
        cart = cart.filter(p => String(p.id) !== String(id));
    }

    saveCart();
    renderCart();
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

    syncCartWithCatalogData();

    items.innerHTML = "";

    const { subtotal, qty, delivery, total } = getCartTotals();

    if (!cart.length) {
        items.innerHTML = `
            <div style="padding:18px;border:1px dashed #e6dceb;border-radius:18px;background:#fff;text-align:center;color:#748097;">
                Кошик поки порожній
            </div>
        `;
    } else {
        items.innerHTML = cart.map(p => {
            const image = getCartItemImage(p);
            const itemTotal = Number(p.price || 0) * Number(p.qty || 0);

            return `
            <div class="cart-item">
                <div style="display:flex;align-items:flex-start;gap:10px;min-width:0;">
                    <img
                        src="${image}"
                        alt="${String(p.name || "").replaceAll('"', '&quot;')}"
                        style="width:64px;height:64px;object-fit:cover;border-radius:14px;background:#f3f3f3;flex-shrink:0;"
                        onerror="this.onerror=null;this.src='product-placeholder.svg'"
                    >
                    <div style="min-width:0;">
                        <div class="cart-item-title">${p.name || "Товар"}</div>
                        <div class="cart-item-sub">${Number(p.price || 0)} грн × ${Number(p.qty || 0)}</div>
                    </div>
                </div>

                <div class="cart-item-side">
                    <div class="cart-item-qty">
                        <button type="button" onclick="cartMinus('${p.id}')">−</button>
                        <span>${Number(p.qty || 0)}</span>
                        <button type="button" onclick="cartPlus('${p.id}')">+</button>
                    </div>
                    <div class="cart-item-total">${itemTotal} грн</div>
                </div>
            </div>
            `;
        }).join("");
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
    const deliveryField = document.getElementById("order-delivery");
    if (!deliveryField) return;

    const delivery = deliveryField.value;

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

        ["order-name","order-surname","order-phone","order-city","order-city-manual","order-index"].forEach(id => {
            const field = document.getElementById(id);
            if (field) field.value = "";
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
    const oldToast = document.querySelector(".cart-toast");
    if (oldToast) oldToast.remove();

    const t = document.createElement("div");
    t.className = "cart-toast show";
    t.innerText = text;
    document.body.appendChild(t);

    setTimeout(() => {
        t.classList.remove("show");
        setTimeout(() => t.remove(), 300);
    }, 1800);
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

document.addEventListener("DOMContentLoaded", () => {
    renderCart();
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

window.addEventListener("products:ready", () => {
    renderCart();
});

window.addEventListener("products:updated", () => {
    renderCart();
});

window.addEventListener("storage", event => {
    if (event.key === "cart") {
        try {
            cart = JSON.parse(localStorage.getItem("cart")) || [];
        } catch (error) {
            cart = [];
        }
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