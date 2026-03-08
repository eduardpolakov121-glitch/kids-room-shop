const DEFAULT_PRODUCTS = [
    {
        id: "toy1",
        name: "Іграшка 1",
        category: "toy",
        price: 350,
        old: 450,
        description: "Яскрава дитяча іграшка для розвитку моторики та уяви.",
        img: "https://picsum.photos/300?random=1"
    },
    {
        id: "toy2",
        name: "Іграшка 2",
        category: "toy",
        price: 400,
        old: 520,
        description: "Безпечна іграшка для дітей від 3 років.",
        img: "https://picsum.photos/300?random=2"
    },
    {
        id: "stroller1",
        name: "Коляска 1",
        category: "stroller",
        price: 3500,
        old: 4200,
        description: "Зручна та легка дитяча коляска для щоденних прогулянок.",
        img: "https://picsum.photos/300?random=3"
    },
    {
        id: "seat1",
        name: "Автокрісло 1",
        category: "seat",
        price: 1800,
        old: 2200,
        description: "Надійне автокрісло для безпечних поїздок з дитиною.",
        img: "https://picsum.photos/300?random=4"
    }
];

function normalizeProduct(raw, fallbackId = null) {
    const price = Number(raw?.price || 0);
    const oldPrice = Number(raw?.old || raw?.price || 0);

    return {
        id: String(raw?.id || fallbackId || `prod_${Date.now()}`),
        name: String(raw?.name || "Без назви").trim(),
        category: String(raw?.category || "toy").trim(),
        price: Number.isFinite(price) ? price : 0,
        old: Number.isFinite(oldPrice) ? oldPrice : 0,
        description: String(raw?.description || "").trim(),
        img: String(raw?.img || "").trim()
    };
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
    localStorage.setItem("products", JSON.stringify(products));
    window.dispatchEvent(new CustomEvent("products:updated", { detail: products }));
}

let products = getProductsFromStorage();

if (products.length === 0) {
    products = DEFAULT_PRODUCTS.map(item => normalizeProduct(item));
    saveProducts();
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
