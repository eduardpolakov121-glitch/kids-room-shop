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

/* ПЕРЕКЛЮЧЕНИЕ ДОСТАВКИ */

function handleDeliveryTypeChange() {
    let delivery = document.getElementById("order-delivery").value;

    let npCityWrap = document.getElementById("np-city-wrap");
    let npWarehouseWrap = document.getElementById("np-warehouse-wrap");
    let ukrWrap = document.getElementById("ukrposhta-wrap");

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

/* API НОВОЙ ПОЧТЫ */

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

async function loadWarehouses(cityRef) {
    return await callNP(
        "AddressGeneral",
        "getWarehouses",
        {
            CityRef: cityRef
        }
    );
}

/* ПОИСК ГОРОДА */

async function handleCityInput() {
    let input = document.getElementById("order-city");
    let list = document.getElementById("city-suggestions");
    let val = input.value.trim();

    selectedCity = null;
    resetWarehouses("Оберіть відділення");

    if (val.length < 2) {
        list.style.display = "none";
        list.innerHTML = "";
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
            let cityName = city.Present || city.MainDescription || city.Description || "Місто";
            let cityRefForWarehouses = city.DeliveryCity || city.Ref || "";

            if (!cityRefForWarehouses) return;

            let div = document.createElement("div");
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

/* ОТДЕЛЕНИЯ */

function resetWarehouses(text) {
    let select = document.getElementById("order-address");
    if (!select) return;
    select.innerHTML = `<option value="">${text}</option>`;
}

async function fillWarehouses(cityRef) {
    let select = document.getElementById("order-address");

    resetWarehouses("Завантаження...");

    let warehouses = await loadWarehouses(cityRef);

    if (!warehouses.length) {
        resetWarehouses("Немає відділень");
        return;
    }

    select.innerHTML = `<option value="">Оберіть відділення</option>`;

    warehouses.forEach(w => {
        let text = w.Description || w.ShortAddress || "Відділення";
        let option = document.createElement("option");
        option.value = text;
        option.innerText = text;
        select.appendChild(option);
    });
}

/* ОТПРАВКА */

async function submitCheckout() {
    let name = document.getElementById("order-name").value.trim();
    let surname = document.getElementById("order-surname").value.trim();
    let phone = document.getElementById("order-phone").value.trim();
    let delivery = document.getElementById("order-delivery").value;

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
        let index = document.getElementById("order-index").value.trim();

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
    let cityInput = document.getElementById("order-city");
    let list = document.getElementById("city-suggestions");

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