const PRODUCT_PLACEHOLDER = "product-placeholder.svg";

const CATEGORIES = [
    { id: "toy", name: "Іграшки", icon: "🧸" },
    { id: "stroller", name: "Коляски", icon: "🛒" },
    { id: "seat", name: "Автокрісла", icon: "💺" },
    { id: "clothes", name: "Одяг", icon: "👕" },
    { id: "transport", name: "Транспорт", icon: "🚲" },
    { id: "sorter", name: "Сортери", icon: "🧩" },
    { id: "baby", name: "Для немовлят", icon: "🍼" },
    { id: "school", name: "Шкільні товари", icon: "🎒" },
    { id: "furniture", name: "Дитячі меблі", icon: "🛏️" },
    { id: "feeding", name: "Годування", icon: "🥣" },
    { id: "hygiene", name: "Гігієна", icon: "🧼" },
    { id: "bedding", name: "Постіль", icon: "🛌" },
    { id: "creativity", name: "Творчість", icon: "🎨" }
];

const DEFAULT_PRODUCTS = [
    {
        id: "toy1",
        name: "Плюшевий ведмедик",
        category: "toy",
        price: 350,
        old: 450,
        description: "М'яка іграшка для обіймів та спокійних ігор.",
        img: PRODUCT_PLACEHOLDER
    },
    {
        id: "sorter1",
        name: "Дерев'яний сортер",
        category: "sorter",
        price: 400,
        old: 520,
        description: "Розвиває моторику, увагу та логіку дитини.",
        img: PRODUCT_PLACEHOLDER
    },
    {
        id: "stroller1",
        name: "Прогулянкова коляска",
        category: "stroller",
        price: 3500,
        old: 4200,
        description: "Легка коляска для щоденних прогулянок і подорожей.",
        img: PRODUCT_PLACEHOLDER
    },
    {
        id: "seat1",
        name: "Автокрісло Basic",
        category: "seat",
        price: 1800,
        old: 2200,
        description: "Надійне автокрісло для безпечних поїздок.",
        img: PRODUCT_PLACEHOLDER
    }
];

function isExternalImage(url) {
    return /^https?:\/\//i.test(String(url || "").trim());
}

function sanitizeProductImage(url) {
    const value = String(url || "").trim();
    if (!value || isExternalImage(value)) return PRODUCT_PLACEHOLDER;
    return value;
}

function normalizeProduct(raw, fallbackId = null) {
    const price = Number(raw?.price || 0);
    const oldPrice = Number(raw?.old || raw?.price || 0);
    const knownCategory = CATEGORIES.some(category => category.id === String(raw?.category || "").trim());

    return {
        id: String(raw?.id || fallbackId || `prod_${Date.now()}`),
        name: String(raw?.name || "Без назви").trim(),
        category: knownCategory ? String(raw?.category).trim() : "toy",
        price: Number.isFinite(price) ? price : 0,
        old: Number.isFinite(oldPrice) ? oldPrice : 0,
        description: String(raw?.description || "").trim(),
        img: sanitizeProductImage(raw?.img)
    };
}

function getCategoryName(categoryId) {
    const category = CATEGORIES.find(item => item.id === categoryId);
    return category ? category.name : (categoryId || "Без категорії");
}

function getCategoryIcon(categoryId) {
    const category = CATEGORIES.find(item => item.id === categoryId);
    return category ? category.icon : "📦";
}

function getSafeProductImage(product) {
    return sanitizeProductImage(product?.img);
}

function getProductsFromStorage() {
    try {
        const stored = JSON.parse(localStorage.getItem("products") || "[]");
        if (!Array.isArray(stored)) return [];
        return stored.map((item, index) => normalizeProduct(item, `prod_${index + 1}`));
    } catch (error) {
        console.error("Не вдалося прочитати товари з localStorage", error);
        return [];
    }
}

function saveProducts() {
    products = products.map((item, index) => normalizeProduct(item, item?.id || `prod_${index + 1}`));
    localStorage.setItem("products", JSON.stringify(products));
    window.dispatchEvent(new CustomEvent("products:updated", { detail: products }));
}

let products = getProductsFromStorage();

if (products.length === 0) {
    products = DEFAULT_PRODUCTS.map(item => normalizeProduct(item));
    saveProducts();
} else {
    const hadExternalImages = products.some(item => isExternalImage(item.img));
    if (hadExternalImages) {
        products = products.map(item => normalizeProduct(item, item.id));
        saveProducts();
    }
}

function refreshProductsFromStorage() {
    products = getProductsFromStorage();
    return products;
}

window.addEventListener("storage", event => {
    if (event.key === "products") {
        refreshProductsFromStorage();
    }
});
