let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* ВІДКРИТТЯ КОШИКА */

function toggleCart() {
    document.getElementById("cart").classList.toggle("open");
    document.getElementById("cart-overlay").classList.toggle("active");
}

function closeCart() {
    document.getElementById("cart").classList.remove("open");
    document.getElementById("cart-overlay").classList.remove("active");
}

/* ДОДАТИ В КОШИК */

function addToCart(id) {
    let qtyInput = document.getElementById("qty-" + id);
    let qty = parseInt(qtyInput ? qtyInput.value : 1);

    if (isNaN(qty) || qty < 1) qty = 1;

    let product = products.find(p => p.id === id);
    if (!product) return;

    let item = cart.find(p => p.id === id);

    if (item) {
        item.qty += qty;
    } else {
        cart.push({ ...product, qty: qty });
    }

    renderCart();
    saveCart();
    animateFly(id);
    showToast("Товар додано в кошик ✅");
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

/* РЕНДЕР КОШИКА */

function renderCart() {
    let items = document.getElementById("cart-items");
    let countEl = document.getElementById("cart-count");
    let totalEl = document.getElementById("total");

    if (!items || !countEl || !totalEl) return;

    items.innerHTML = "";

    let total = 0;
    let count = 0;

    cart.forEach(p => {
        total += p.price * p.qty;
        count += p.qty;

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

    countEl.innerText = count;
    totalEl.innerText = "Разом: " + total + " грн";
}

/* МОДАЛЬНЕ ВІКНО ЗАМОВЛЕННЯ */

function checkout() {
    if (cart.length === 0) {
        alert("Кошик порожній");
        return;
    }

    let modal = document.getElementById("checkout-modal");
    if (modal) {
        modal.classList.add("open");
    }
}

function closeCheckoutModal() {
    let modal = document.getElementById("checkout-modal");
    if (modal) {
        modal.classList.remove("open");
    }
}

function updateDeliveryPlaceholder() {
    let delivery = document.getElementById("order-delivery");
    let address = document.getElementById("order-address");

    if (!delivery || !address) return;

    if (delivery.value === "Нова пошта") {
        address.placeholder = "Відділення Нової пошти";
    } else {
        address.placeholder = "Відділення або адреса Укрпошти";
    }
}

async function submitCheckout() {
    let name = document.getElementById("order-name").value.trim();
    let surname = document.getElementById("order-surname").value.trim();
    let phone = document.getElementById("order-phone").value.trim();
    let city = document.getElementById("order-city").value.trim();
    let delivery = document.getElementById("order-delivery").value;
    let address = document.getElementById("order-address").value.trim();

    if (!name || !surname || !phone || !city || !delivery || !address) {
        alert("Будь ласка, заповніть усі поля");
        return;
    }

    let order = {
        name: name + " " + surname,
        phone: phone,
        city: city,
        delivery: delivery,
        address: address,
        items: cart,
        total: cart.reduce((sum, p) => sum + p.price * p.qty, 0),
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
        document.getElementById("order-address").value = "";

        closeCheckoutModal();
        closeCart();

        alert("Замовлення оформлено ✅");
    } catch (error) {
        console.error(error);
        alert("Помилка CRM: " + error.message);
    }
}

/* TOAST */

function showToast(text) {
    let toast = document.createElement("div");

    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.background = "#ff6600";
    toast.style.color = "white";
    toast.style.padding = "15px 25px";
    toast.style.borderRadius = "10px";
    toast.style.zIndex = "9999";

    toast.innerText = text;

    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2000);
}

/* АНІМАЦІЯ */

function animateFly(id) {
    let productEl = document.querySelector(`#prod-${id}`);
    let cartBtn = document.querySelector(".cart-button");

    if (!productEl || !cartBtn) return;

    let clone = productEl.cloneNode(true);

    clone.style.position = "fixed";
    clone.style.top = productEl.getBoundingClientRect().top + "px";
    clone.style.left = productEl.getBoundingClientRect().left + "px";
    clone.style.width = productEl.offsetWidth + "px";
    clone.style.transition = "0.7s ease";
    clone.style.zIndex = "9999";

    document.body.appendChild(clone);

    setTimeout(() => {
        let rect = cartBtn.getBoundingClientRect();
        clone.style.top = rect.top + "px";
        clone.style.left = rect.left + "px";
        clone.style.width = "40px";
        clone.style.opacity = "0";
    }, 20);

    setTimeout(() => clone.remove(), 800);
}

function clearCart() {
    cart = [];
    renderCart();
    saveCart();
}

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

renderCart();
updateDeliveryPlaceholder();