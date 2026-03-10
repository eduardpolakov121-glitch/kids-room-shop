let cart = JSON.parse(localStorage.getItem("cart")) || [];

const NOVA_POSHTA_API_KEY = "0cddc3bd30e2e4de2f2ce8f46313a168";
const NOVA_POSHTA_API_URL = "https://api.novaposhta.ua/v2.0/json/";

let selectedCity = null;

/* КОРЗИНА */

function animateCartButton() {
    const cartButton = document.querySelector('.cart-button');
    if (!cartButton || !cartButton.animate) return;

    cartButton.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.18)' },
        { transform: 'scale(0.96)' },
        { transform: 'scale(1.08)' },
        { transform: 'scale(1)' }
    ], {
        duration: 520,
        easing: 'ease-out'
    });
}

function findProductImageById(id) {
    const cardImg = document.querySelector(`#prod-${id} img`);
    if (cardImg) return cardImg;

    const productPageImg = document.querySelector('#product-page img');
    if (productPageImg) return productPageImg;

    return null;
}

function flyToCart(id) {
    const cartButton = document.querySelector('.cart-button');
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
    clone.style.position = 'fixed';
    clone.style.left = start.left + 'px';
    clone.style.top = start.top + 'px';
    clone.style.width = start.width + 'px';
    clone.style.height = start.height + 'px';
    clone.style.borderRadius = '12px';
    clone.style.objectFit = 'cover';
    clone.style.zIndex = '99999';
    clone.style.pointerEvents = 'none';
    clone.style.transition = 'transform 0.8s cubic-bezier(.22,.61,.36,1), opacity 0.8s ease, left 0.8s cubic-bezier(.22,.61,.36,1), top 0.8s cubic-bezier(.22,.61,.36,1), width 0.8s ease, height 0.8s ease';
    clone.style.boxShadow = '0 16px 40px rgba(0,0,0,0.22)';
    document.body.appendChild(clone);

    const endLeft = end.left + end.width / 2 - 18;
    const endTop = end.top + end.height / 2 - 18;

    requestAnimationFrame(() => {
        clone.style.left = endLeft + 'px';
        clone.style.top = endTop + 'px';
        clone.style.width = '36px';
        clone.style.height = '36px';
        clone.style.opacity = '0.25';
        clone.style.transform = 'scale(0.25) rotate(16deg)';
    });

    setTimeout(() => {
        clone.remove();
        animateCartButton();
    }, 820);
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
    } else {
        cart.push({ ...product, qty });
    }

    flyToCart(id);
    renderCart();
    saveCart();
    showToast("Товар додано в кошик");
}

function cartPlus(id) {
    const item = cart.find(p => p.id === id);
    if (!item) return;

    item.qty++;
    renderCart();
    saveCart();
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
}

function renderCart() {
    const items = document.getElementById("cart-items");
    const count = document.getElementById("cart-count");
    const total = document.getElementById("total");

    if (!items || !count || !total) return;

    items.innerHTML = "";

    let sum = 0;
    let qty = 0;

    cart.forEach(p => {
        sum += p.price * p.qty;
        qty += p.qty;

        items.innerHTML += `
        <div class="cart-item">
            <div>
                ${p.name}<br>
                ${p.price} грн
            </div>
            <div>
                <button onclick="cartMinus('${p.id}')">−</button>
                ${p.qty}
                <button onclick="cartPlus('${p.id}')">+</button>
            </div>
        </div>
        `;
    });

    count.innerText = qty;
    total.innerText = "Разом: " + sum + " грн";
}

/* МОДАЛКА */
function checkout() {
    if (cart.length === 0) {
        alert("Кошик порожній");
        return;
    }

    document.getElementById("checkout-modal").classList.add("open");
    handleDeliveryTypeChange();
}

function closeCheckoutModal() {
    document.getElementById("checkout-modal").classList.remove("open");
}

/* ПЕРЕКЛЮЧЕННЯ ДОСТАВКИ */
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

/* API НОВОЇ ПОШТИ */
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

/* ПОШУК МІСТА */
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
            const cityName = city.Present || city.MainDescription || city.Description || "Місто";
            const cityRefForWarehouses = city.DeliveryCity || city.Ref || "";

            if (!cityRefForWarehouses) return;

            const div = document.createElement("div");
            div.className = "np-suggestion-item";
            div.innerText = cityName;

            div.onclick = async () => {
                input.value = cityName;
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
    });
}

/* ВІДДІЛЕННЯ */
function resetWarehouses(text) {
    const select = document.getElementById("order-address");
    if (!select) return;
    select.innerHTML = `<option value="">${text}</option>`;
}

async function fillWarehouses(cityRef) {
    const select = document.getElementById("order-address");
    resetWarehouses("Завантаження...");

    const warehouses = await loadWarehouses(cityRef);

    if (!warehouses.length) {
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

/* ВІДПРАВКА */
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
        await saveOrderCRM(order);

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

        alert("Замовлення оформлено");
    } catch (error) {
        console.error(error);
        alert("Помилка CRM: " + error.message);
    }
}

/* TOAST */
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

/* SAVE */
function clearCart() {
    cart = [];
    saveCart();
    renderCart();
}

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

/* INIT */
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
});const SUPABASE_URL = "https://xhhzxiithajxgngmbzzd.supabase.co";
const SUPABASE_KEY = "sb_publishable_cRp6r2C_3nszludByS9V9Q_sl1QlHg5";

function normalizeOrderForCRM(order) {
    return {
        ...order,
        status: order.status || "Новий",
        status_group: order.status_group || "new",
        operator_comment: order.operator_comment || "",
        manager_comment: order.manager_comment || "",
        day_bucket: Number.isFinite(Number(order.day_bucket)) ? Number(order.day_bucket) : 0,
        source: order.source || "website"
    };
}

async function saveOrderCRM(order) {
    const payload = normalizeOrderForCRM(order);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            Prefer: "return=representation"
        },
        body: JSON.stringify(payload)
    });

    const text = await response.text();

    if (!response.ok) {
        console.error("CRM INSERT ERROR:", text);
        throw new Error(text || "Помилка збереження замовлення в CRM");
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

async function getOrdersCRM() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc`, {
        method: "GET",
        headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
        }
    });

    const text = await response.text();

    if (!response.ok) {
        console.error("CRM LOAD ERROR:", text);
        throw new Error(text || "Помилка завантаження замовлень з CRM");
    }

    try {
        return JSON.parse(text);
    } catch {
        return [];
    }
}

async function updateOrderStatusCRM(id, status, statusGroup = null, dayBucket = null) {
    const patch = { status };

    if (statusGroup !== null) patch.status_group = statusGroup;
    if (dayBucket !== null) patch.day_bucket = dayBucket;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            Prefer: "return=representation"
        },
        body: JSON.stringify(patch)
    });

    const text = await response.text();

    if (!response.ok) {
        console.error("CRM STATUS ERROR:", text);
        throw new Error(text || "Помилка оновлення статусу");
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

async function updateOrderCommentCRM(id, operatorComment, managerComment = null) {
    const payload = { operator_comment: operatorComment || "" };
    if (managerComment !== null) payload.manager_comment = managerComment || "";

    const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            Prefer: "return=representation"
        },
        body: JSON.stringify(payload)
    });

    const text = await response.text();

    if (!response.ok) {
        console.error("CRM COMMENT ERROR:", text);
        throw new Error(text || "Помилка оновлення коментаря");
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

async function deleteOrderCRM(id) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
        }
    });

    const text = await response.text();

    if (!response.ok) {
        console.error("CRM DELETE ERROR:", text);
        throw new Error(text || "Помилка видалення замовлення");
    }

    return true;
}

window.normalizeOrderForCRM = normalizeOrderForCRM;
window.saveOrderCRM = saveOrderCRM;
window.getOrdersCRM = getOrdersCRM;
window.updateOrderStatusCRM = updateOrderStatusCRM;
window.updateOrderCommentCRM = updateOrderCommentCRM;
window.deleteOrderCRM = deleteOrderCRM;

