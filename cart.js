let cart = JSON.parse(localStorage.getItem("cart")) || [];

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

function renderCart() {
    let items = document.getElementById("cart-items");
    let countEl = document.getElementById("cart-count");
    let totalEl = document.getElementById("total");
    let checkoutTotalEl = document.getElementById("checkout-total");

    if (!items || !countEl || !totalEl) return;

    items.innerHTML = "";

    let total = 0;
    let count = 0;

    cart.forEach(p => {
        total += p.price * p.qty;
        count += p.qty;

        items.innerHTML += `
        <div class="cart-item">
            <div class="cart-item-meta">
                <img class="cart-thumb" src="${p.img || ''}" alt="${p.name || ''}">
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
        </div>`;
    });

    if (!cart.length) {
        items.innerHTML = '<p style="color:#667788;">Ваш кошик поки порожній.</p>';
    }

    countEl.innerText = count;
    totalEl.innerText = "Разом: " + total + " грн";

    if (checkoutTotalEl) {
        checkoutTotalEl.innerText = "Разом: " + total + " грн";
    }
}

function openCheckoutModal() {
    if (cart.length === 0) {
        alert("Кошик порожній");
        return;
    }

    renderCart();
    document.getElementById("checkout-modal").classList.remove("hidden");
}

function closeCheckoutModal() {
    document.getElementById("checkout-modal").classList.add("hidden");
}

async function submitCheckout() {
    if (cart.length === 0) {
        alert("Кошик порожній");
        return;
    }

    const name = document.getElementById("checkout-name").value.trim();
    const surname = document.getElementById("checkout-surname").value.trim();
    const phone = document.getElementById("checkout-phone").value.trim();
    const city = document.getElementById("checkout-city").value.trim();
    const delivery = document.getElementById("checkout-delivery").value;
    const branch = document.getElementById("checkout-branch").value.trim();

    if (!name || !surname || !phone || !city || !delivery || !branch) {
        alert("Будь ласка, заповніть усі поля замовлення");
        return;
    }

    const cleanPhone = phone.replace(/\s+/g, "");

    const order = {
        name: `${name} ${surname}`,
        first_name: name,
        last_name: surname,
        phone: cleanPhone,
        city,
        delivery_method: delivery,
        delivery_branch: branch,
        items: cart,
        total: cart.reduce((sum, p) => sum + p.price * p.qty, 0),
        status: "Новий"
    };

    try {
        await saveOrderCRM(order);
        cart = [];
        saveCart();
        renderCart();
        clearCheckoutForm();
        closeCheckoutModal();
        closeCart();
        alert("Замовлення оформлено ✅");
    } catch (error) {
        console.error(error);
        alert("Помилка CRM: " + error.message);
    }
}

function clearCheckoutForm() {
    document.getElementById("checkout-name").value = "";
    document.getElementById("checkout-surname").value = "";
    document.getElementById("checkout-phone").value = "";
    document.getElementById("checkout-city").value = "";
    document.getElementById("checkout-delivery").value = "";
    document.getElementById("checkout-branch").value = "";
}

function showToast(text) {
    let toast = document.createElement("div");
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.background = "#ff8a3d";
    toast.style.color = "white";
    toast.style.padding = "15px 25px";
    toast.style.borderRadius = "10px";
    toast.style.zIndex = "9999";
    toast.style.boxShadow = "0 10px 24px rgba(0,0,0,0.18)";
    toast.innerText = text;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

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

window.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeCheckoutModal();
    }
});

renderCart();
