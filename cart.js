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
    document.body.classList.toggle("cart-open", willOpen);
}

function closeCart() {
    const cartEl = document.getElementById("cart");
    const overlay = document.getElementById("cart-overlay");
    if (!cartEl || !overlay) return;

    cartEl.classList.remove("open");
    overlay.classList.remove("active");
    document.body.classList.remove("cart-open");
}

function addToCart(id) {
    const qtyInput = document.getElementById("qty-" + id);
    const qtyValue = qtyInput ? parseInt(qtyInput.value, 10) : 1;
    const qty = Number.isNaN(qtyValue) || qtyValue < 1 ? 1 : qtyValue;

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
    bumpCartButton();
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
    const badge = document.getElementById("cart-badge");
    const total = document.getElementById("total");

    if (!items || !count || !total) return;

    items.innerHTML = "";
    let sum = 0;
    let qty = 0;

    if (!cart.length) {
        items.innerHTML = `
            <div class="cart-empty">
                У кошику поки що немає товарів.<br>
                Додай товар із каталогу, щоб оформити замовлення.
            </div>
        `;
    }

    cart.forEach(p => {
        const price = Number(p.price || 0);
        const lineTotal = price * Number(p.qty || 0);

        sum += lineTotal;
        qty += Number(p.qty || 0);

        const image = getCartItemImage(p);

        items.innerHTML += `
        <div class="cart-item">
            <div class="cart-item-media">
                <img
                    src="${image}"
                    alt="${String(p.name || "").replace(/"/g, "&quot;")}"
                    onerror="this.onerror=null;this.src='product-placeholder.svg'"
                >
            </div>

            <div class="cart-item-info">
                <div class="cart-item-name">${p.name}</div>
                <div class="cart-item-price">${price} грн / шт</div>

                <div class="cart-item-controls">
                    <button type="button" onclick="cartMinus('${p.id}')">−</button>
                    <span class="cart-item-qty">${p.qty}</span>
                    <button type="button" onclick="cartPlus('${p.id}')">+</button>
                </div>
            </div>

            <div class="cart-item-total">
                ${lineTotal} грн
            </div>
        </div>
        `;
    });

    count.innerText = qty;
    if (badge) badge.innerText = qty;
    total.innerText = sum + " грн";
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

function bumpCartButton() {
    const button = document.querySelector(".cart-button");
    if (!button) return;

    button.classList.remove("bump");
    void button.offsetWidth;
    button.classList.add("bump");
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
    }, 1700);
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

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeCart();
            closeCheckoutModal();
            closeSuccessModal();
        }
    });
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