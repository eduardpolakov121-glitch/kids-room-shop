let cart = JSON.parse(localStorage.getItem("cart")) || [];

const NOVA_POSHTA_API_KEY = "0cddc3bd30e2e4de2f2ce8f46313a168";
const NOVA_POSHTA_API_URL = "https://api.novaposhta.ua/v2.0/json/";
const FREE_DELIVERY_THRESHOLD = 1000;

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
    document.getElementById("cart").classList.toggle("open");
}

function closeCart() {
    document.getElementById("cart").classList.remove("open");
}

function getCartSum() {
    return cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
}

function hasFreeDelivery(sum = null) {
    const total = sum === null ? getCartSum() : Number(sum || 0);
    return total >= FREE_DELIVERY_THRESHOLD;
}

function getRemainingForFreeDelivery(sum = null) {
    const total = sum === null ? getCartSum() : Number(sum || 0);
    return Math.max(0, FREE_DELIVERY_THRESHOLD - total);
}

function addToCart(id) {
    const qtyInput = document.getElementById("qty-" + id);
    const qty = Math.max(1, parseInt(qtyInput?.value || "1", 10) || 1);

    const product = products.find(p => p.id == id);
    if (!product) return;

    const item = cart.find(p => p.id == id);

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
    const item = cart.find(p => p.id == id);
    if (!item) return;

    item.qty++;
    renderCart();
    saveCart();
}

function cartMinus(id) {
    const item = cart.find(p => p.id == id);
    if (!item) return;

    if (item.qty > 1) {
        item.qty--;
    } else {
        cart = cart.filter(p => p.id != id);
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
        sum += Number(p.price || 0) * Number(p.qty || 0);
        qty += Number(p.qty || 0);

        const image = getCartItemImage(p);

        items.innerHTML += `
        <div class="cart-item">
            <div style="display:flex;align-items:center;gap:10px;">
                <img
                    src="${image}"
                    alt="${p.name}"
                    style="width:55px;height:55px;object-fit:cover;border-radius:10px;background:#f3f3f3;"
                    onerror="this.onerror=null;this.src='product-placeholder.svg'"
                >
                <div>
                    ${p.name}<br>
                    ${p.price} грн
                </div>
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

    const freeDelivery = hasFreeDelivery(sum);
    const remaining = getRemainingForFreeDelivery(sum);

    total.innerHTML = freeDelivery
        ? `Разом: ${sum} грн<br><span style="font-size:14px;color:#15803d;font-weight:700;">🚚 Доставка безкоштовна</span>`
        : `Разом: ${sum} грн<br><span style="font-size:14px;color:#6f7b8c;font-weight:700;">До безкоштовної доставки залишилось ${remaining} грн</span>`;
}

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

    const totalSum = getCartSum();

    const order = {
        customer_first_name: name,
        customer_last_name: surname,
        name: `${name} ${surname}`.trim(),
        phone,
        city,
        delivery,
        address,
        items: cart,
        total: totalSum,
        status: "Прийнято",
        status_group: "accepted",
        operator_comment: hasFreeDelivery(totalSum)
            ? "Доставка безкоштовна: замовлення від 1000 грн"
            : "",
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
}

renderCart();

document.addEventListener("DOMContentLoaded", () => {
    handleDeliveryTypeChange();

    const cityInput = document.getElementById("order-city");
    const list = document.getElementById("city-suggestions");

    if (cityInput) {
        cityInput.addEventListener("input", handleCityInput);
        cityInput.addEventListener("blur", () => {
            setTimeout(() => {
                if (list) list.style.display = "none";
            }, 200);
        });

        cityInput.addEventListener("focus", () => {
            if (list && list.innerHTML.trim() !== "") {
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