let cart = JSON.parse(localStorage.getItem("cart")) || [];

const NOVA_POSHTA_API_KEY = "0cddc3bd30e2e4de2f2ce8f46313a168";
const NOVA_POSHTA_API_URL = "https://api.novaposhta.ua/v2.0/json/";

let selectedCity = null;

function toggleCart() {
    document.getElementById("cart")?.classList.toggle("open");
    document.getElementById("cart-overlay")?.classList.toggle("active");
}

function closeCart() {
    document.getElementById("cart")?.classList.remove("open");
    document.getElementById("cart-overlay")?.classList.remove("active");
}

function animateAddToCart(id) {
    const card = document.getElementById(`prod-${id}`);
    if (card) {
        card.classList.remove("product-added");
        void card.offsetWidth;
        card.classList.add("product-added");
        setTimeout(() => card.classList.remove("product-added"), 650);
    }

    const cartButton = document.querySelector(".cart-button");
    if (cartButton) {
        cartButton.classList.remove("cart-bump");
        void cartButton.offsetWidth;
        cartButton.classList.add("cart-bump");
        setTimeout(() => cartButton.classList.remove("cart-bump"), 650);
    }
}

function addToCart(id) {
    refreshProductsFromStorage();

    const qtyInput = document.getElementById("qty-" + id);
    let qty = parseInt(qtyInput ? qtyInput.value : 1, 10);
    if (isNaN(qty) || qty < 1) qty = 1;

    const product = products.find(item => item.id === id);
    if (!product) return;

    const item = cart.find(entry => entry.id === id);
    if (item) {
        item.qty += qty;
    } else {
        cart.push({ ...product, img: getSafeProductImage(product), qty });
    }

    renderCart();
    saveCart();
    animateAddToCart(id);
    showToast("Товар додано в кошик");
}

function cartPlus(id) {
    const item = cart.find(entry => entry.id === id);
    if (!item) return;
    item.qty++;
    renderCart();
    saveCart();
}

function cartMinus(id) {
    const item = cart.find(entry => entry.id === id);
    if (!item) return;

    if (item.qty > 1) {
        item.qty--;
    } else {
        cart = cart.filter(entry => entry.id !== id);
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

    cart.forEach(item => {
        sum += item.price * item.qty;
        qty += item.qty;

        items.innerHTML += `
        <div class="cart-item">
            <div class="cart-item-main">
                <img class="cart-item-image" src="${getSafeProductImage(item)}" alt="${item.name}" onerror="this.onerror=null;this.src='${PRODUCT_PLACEHOLDER}'">
                <div>
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${item.price} грн</div>
                </div>
            </div>
            <div class="cart-item-controls">
                <button type="button" onclick="cartMinus('${item.id}')">−</button>
                <span>${item.qty}</span>
                <button type="button" onclick="cartPlus('${item.id}')">+</button>
            </div>
        </div>
        `;
    });

    if (!cart.length) {
        items.innerHTML = `<div class="cart-empty">Кошик поки порожній</div>`;
    }

    count.innerText = qty;
    total.innerText = "Разом: " + sum + " грн";
}

function checkout() {
    if (cart.length === 0) {
        alert("Кошик порожній");
        return;
    }

    document.getElementById("checkout-modal")?.classList.add("open");
    handleDeliveryTypeChange();
}

function closeCheckoutModal() {
    document.getElementById("checkout-modal")?.classList.remove("open");
}

function handleDeliveryTypeChange() {
    const delivery = document.getElementById("order-delivery")?.value;

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
                selectedCity = { name: cityName, ref: cityRefForWarehouses };
                list.style.display = "none";
                list.innerHTML = "";
                await fillWarehouses(cityRefForWarehouses);
            };

            list.appendChild(div);
        });
    });
}

function resetWarehouses(text) {
    const select = document.getElementById("order-address");
    if (!select) return;
    select.innerHTML = `<option value="">${text}</option>`;
}

async function fillWarehouses(cityRef) {
    const select = document.getElementById("order-address");
    if (!select) return;

    resetWarehouses("Завантаження...");
    const warehouses = await loadWarehouses(cityRef);

    if (!warehouses.length) {
        resetWarehouses("Немає відділень");
        return;
    }

    select.innerHTML = `<option value="">Оберіть відділення</option>`;
    warehouses.forEach(warehouse => {
        const text = warehouse.Description || warehouse.ShortAddress || "Відділення";
        const option = document.createElement("option");
        option.value = text;
        option.innerText = text;
        select.appendChild(option);
    });
}

async function submitCheckout() {
    const name = document.getElementById("order-name")?.value.trim();
    const surname = document.getElementById("order-surname")?.value.trim();
    const phone = document.getElementById("order-phone")?.value.trim();
    const delivery = document.getElementById("order-delivery")?.value;

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
        items: cart.map(item => ({ ...item, img: getSafeProductImage(item) })),
        total: cart.reduce((sum, item) => sum + item.price * item.qty, 0),
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
        showToast("Замовлення оформлено");
    } catch (error) {
        console.error(error);
        alert("Помилка CRM: " + error.message);
    }
}

function showToast(text) {
    let toastHost = document.getElementById("toast-host");
    if (!toastHost) {
        toastHost = document.createElement("div");
        toastHost.id = "toast-host";
        toastHost.className = "toast-host";
        document.body.appendChild(toastHost);
    }

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = text;
    toastHost.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));

    setTimeout(() => {
        toast.classList.remove("show");
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 280);
    }, 1900);
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
