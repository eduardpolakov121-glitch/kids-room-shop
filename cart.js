let cart = JSON.parse(localStorage.getItem("cart")) || [];

const NOVA_POSHTA_API_KEY = "0cddc3bd30e2e4de2f2ce8f46313a168";
const NOVA_POSHTA_API_URL = "https://api.novaposhta.ua/v2.0/json/";

let selectedCity = null;

/* КОРЗИНА */

function toggleCart() {
    document.getElementById("cart").classList.toggle("open");
    document.getElementById("cart-overlay").classList.toggle("active");
}

function closeCart() {
    document.getElementById("cart").classList.remove("open");
    document.getElementById("cart-overlay").classList.remove("active");
}

/* ДОБАВИТЬ В КОРЗИНУ */

function addToCart(id) {
    let qtyInput = document.getElementById("qty-" + id);
    let qty = parseInt(qtyInput ? qtyInput.value : 1, 10);

    if (isNaN(qty) || qty < 1) qty = 1;

    let product = products.find(p => p.id === id);
    if (!product) return;

    let item = cart.find(p => p.id === id);

    if (item) {
        item.qty += qty;
    } else {
        cart.push({ ...product, qty });
    }

    renderCart();
    saveCart();
    showToast("Товар додано в кошик");
}

function cartPlus(id) {
    let item = cart.find(p => p.id === id);
    if (!item) return;

    item.qty++;
    renderCart();
    saveCart();
}

function cartMinus(id) {
    let item = cart.find(p => p.id === id);
    if (!item) return;

    if (item.qty > 1) {
        item.qty--;
    } else {
        cart = cart.filter(p => p.id !== id);
    }

    renderCart();
    saveCart();
}

/* РЕНДЕР КОРЗИНЫ */

function renderCart() {
    let items = document.getElementById("cart-items");
    let count = document.getElementById("cart-count");
    let total = document.getElementById("total");

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

/* ОФОРМЛЕНИЕ */

function checkout() {
    if (cart.length === 0) {
        alert("Кошик порожній");
        return;
    }

    document.getElementById("checkout-modal").classList.add("open");
}

/* ЗАКРЫТЬ */

function closeCheckoutModal() {
    document.getElementById("checkout-modal").classList.remove("open");
}

/* НОВА ПОШТА API */

async function callNP(model, method, props) {
    let res = await fetch(NOVA_POSHTA_API_URL, {
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

    let data = await res.json();

    if (!data.success) {
        console.error("Nova Poshta API error:", data);
        return [];
    }

    return data.data || [];
}

/* ЗАГРУЗКА ОТДЕЛЕНИЙ */

async function loadWarehouses(cityRef) {
    let data = await callNP(
        "AddressGeneral",
        "getWarehouses",
        {
            CityRef: cityRef
        }
    );

    return data;
}

/* ПОИСК ГОРОДА — ИСПРАВЛЕННЫЙ */

async function handleCityInput() {
    let input = document.getElementById("order-city");
    let list = document.getElementById("city-suggestions");

    let val = input.value.trim();

    if (val.length < 2) {
        list.style.display = "none";
        list.innerHTML = "";
        selectedCity = null;
        return;
    }

    let result = await callNP(
        "Address",
        "searchSettlements",
        {
            CityName: val,
            Limit: 20
        }
    );

    list.innerHTML = "";

    if (!result.length) {
        list.style.display = "none";
        return;
    }

    list.style.display = "block";

    result.forEach(item => {
        if (!item.Addresses || !item.Addresses.length) return;

        item.Addresses.forEach(city => {
            let div = document.createElement("div");

            div.className = "np-suggestion-item";
            div.innerText = city.Present || city.MainDescription || city.Description || "Місто";

            div.onclick = () => {
                input.value = city.Present || city.MainDescription || city.Description || "";
                selectedCity = city;
                list.style.display = "none";
                fillWarehouses(city.Ref);
            };

            list.appendChild(div);
        });
    });
}

/* ЗАПОЛНИТЬ ОТДЕЛЕНИЯ */

async function fillWarehouses(cityRef) {
    let select = document.getElementById("order-address");

    select.innerHTML = "<option value=''>Завантаження...</option>";

    let warehouses = await loadWarehouses(cityRef);

    select.innerHTML = "<option value=''>Оберіть відділення</option>";

    warehouses.forEach(w => {
        let option = document.createElement("option");
        option.value = w.Description || "";
        option.innerText = w.Description || "Відділення";
        select.appendChild(option);
    });
}

/* ОТПРАВКА */

async function submitCheckout() {
    let name = document.getElementById("order-name").value.trim();
    let surname = document.getElementById("order-surname").value.trim();
    let phone = document.getElementById("order-phone").value.trim();
    let delivery = document.getElementById("order-delivery").value;
    let city = document.getElementById("order-city").value.trim();
    let address = document.getElementById("order-address").value;

    if (!name || !surname || !phone) {
        alert("Заповніть всі поля");
        return;
    }

    if (!city) {
        alert("Оберіть місто");
        return;
    }

    if (!address) {
        alert("Оберіть відділення");
        return;
    }

    let order = {
        name: name + " " + surname,
        phone: phone,
        city: city,
        delivery: delivery,
        address: address,
        items: cart,
        total: cart.reduce((s, p) => s + p.price * p.qty, 0),
        status: "Новий"
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
        document.getElementById("order-address").innerHTML = "<option value=''>Оберіть відділення</option>";

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
    let t = document.createElement("div");

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

/* CLEAR */

function clearCart() {
    cart = [];
    saveCart();
    renderCart();
}

/* SAVE */

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

/* INIT */

renderCart();

document.addEventListener("DOMContentLoaded", () => {
    let cityInput = document.getElementById("order-city");
    let list = document.getElementById("city-suggestions");

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