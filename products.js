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

const SUPABASE_PRODUCTS_CONFIG = {
    url: "https://xhhzxiithajxgngmbzzd.supabase.co",
    anonKey: "sb_publishable_cRp6r2C_3nszludByS9V9Q_sl1QlHg5",
    table: "products"
};

const PRODUCTS_CACHE_KEY = "products";
const PRODUCTS_SYNC_FLAG_KEY = "kids_room_products_last_sync";
const PRODUCTS_INIT_FLAG_KEY = "kids_room_products_seeded";

let products = [];
let supabaseClientInstance = null;
let supabaseReadyPromise = null;
let productsLoadingPromise = null;

function isExternalImage(url) {
    return /^https?:\/\//i.test(String(url || "").trim());
}

function sanitizeProductImage(url) {
    const value = String(url || "").trim();

    if (!value) return PRODUCT_PLACEHOLDER;
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
        price: Number.isFinite(price) ? Math.round(price) : 0,
        old: Number.isFinite(oldPrice) ? Math.round(oldPrice) : 0,
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
        const stored = JSON.parse(localStorage.getItem(PRODUCTS_CACHE_KEY) || "[]");
        if (!Array.isArray(stored)) return [];
        return stored.map((item, index) => normalizeProduct(item, `prod_${index + 1}`));
    } catch (error) {
        console.error("Не вдалося прочитати товари з localStorage", error);
        return [];
    }
}

function saveProductsToLocalCache(list) {
    const normalized = Array.isArray(list)
        ? list.map((item, index) => normalizeProduct(item, item?.id || `prod_${index + 1}`))
        : [];

    products = normalized;
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products));
    localStorage.setItem(PRODUCTS_SYNC_FLAG_KEY, String(Date.now()));
    window.products = products;
    window.dispatchEvent(new CustomEvent("products:updated", { detail: products }));

    if (typeof window.syncProductsAndRender === "function") {
        window.syncProductsAndRender(false);
    }

    return products;
}

function buildSupabaseProductPayload(product) {
    const normalized = normalizeProduct(product, product?.id);

    return {
        id: normalized.id,
        name: normalized.name,
        category: normalized.category,
        price: normalized.price,
        old: normalized.old,
        description: normalized.description,
        img: normalized.img
    };
}

function escapeHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

async function ensureSupabaseLoaded() {
    if (supabaseClientInstance) return supabaseClientInstance;
    if (supabaseReadyPromise) return supabaseReadyPromise;

    supabaseReadyPromise = new Promise((resolve, reject) => {
        const finish = () => {
            try {
                if (!window.supabase || typeof window.supabase.createClient !== "function") {
                    throw new Error("Supabase library not found");
                }

                supabaseClientInstance = window.supabase.createClient(
                    SUPABASE_PRODUCTS_CONFIG.url,
                    SUPABASE_PRODUCTS_CONFIG.anonKey
                );

                resolve(supabaseClientInstance);
            } catch (error) {
                reject(error);
            }
        };

        if (window.supabase && typeof window.supabase.createClient === "function") {
            finish();
            return;
        }

        const existingScript = document.querySelector('script[data-kids-room-supabase="true"]');
        if (existingScript) {
            existingScript.addEventListener("load", finish, { once: true });
            existingScript.addEventListener("error", () => reject(new Error("Не вдалося завантажити Supabase library")), { once: true });
            return;
        }

        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
        script.async = true;
        script.defer = true;
        script.dataset.kidsRoomSupabase = "true";
        script.onload = finish;
        script.onerror = () => reject(new Error("Не вдалося завантажити Supabase library"));
        document.head.appendChild(script);
    });

    return supabaseReadyPromise;
}

async function fetchProductsFromSupabase() {
    const client = await ensureSupabaseLoaded();

    const { data, error } = await client
        .from(SUPABASE_PRODUCTS_CONFIG.table)
        .select("id, name, category, price, old, description, img")
        .order("created_at", { ascending: true });

    if (error) throw error;

    return Array.isArray(data)
        ? data.map((item, index) => normalizeProduct(item, item?.id || `prod_${index + 1}`))
        : [];
}

async function seedDefaultProductsToSupabase() {
    const client = await ensureSupabaseLoaded();
    const payload = DEFAULT_PRODUCTS.map(item => buildSupabaseProductPayload(item));

    const { error } = await client
        .from(SUPABASE_PRODUCTS_CONFIG.table)
        .upsert(payload, { onConflict: "id" });

    if (error) throw error;

    localStorage.setItem(PRODUCTS_INIT_FLAG_KEY, "true");
}

async function deleteMissingProductsFromSupabase(currentProducts) {
    const client = await ensureSupabaseLoaded();

    const { data, error } = await client
        .from(SUPABASE_PRODUCTS_CONFIG.table)
        .select("id");

    if (error) throw error;

    const existingIds = Array.isArray(data) ? data.map(item => String(item.id)) : [];
    const currentIds = currentProducts.map(item => String(item.id));
    const idsToDelete = existingIds.filter(id => !currentIds.includes(id));

    if (!idsToDelete.length) return;

    const { error: deleteError } = await client
        .from(SUPABASE_PRODUCTS_CONFIG.table)
        .delete()
        .in("id", idsToDelete);

    if (deleteError) throw deleteError;
}

async function upsertProductsToSupabase(list) {
    const client = await ensureSupabaseLoaded();
    const normalized = Array.isArray(list)
        ? list.map((item, index) => normalizeProduct(item, item?.id || `prod_${index + 1}`))
        : [];

    const payload = normalized.map(buildSupabaseProductPayload);

    if (payload.length) {
        const { error } = await client
            .from(SUPABASE_PRODUCTS_CONFIG.table)
            .upsert(payload, { onConflict: "id" });

        if (error) throw error;
    }

    await deleteMissingProductsFromSupabase(normalized);

    return normalized;
}

async function loadProductsFromSupabaseAndApply() {
    try {
        let remoteProducts = await fetchProductsFromSupabase();

        if (!remoteProducts.length) {
            await seedDefaultProductsToSupabase();
            remoteProducts = await fetchProductsFromSupabase();
        }

        saveProductsToLocalCache(remoteProducts);
        return remoteProducts;
    } catch (error) {
        console.error("Помилка завантаження товарів із Supabase:", error);
        return products;
    }
}

async function initializeProducts() {
    if (productsLoadingPromise) return productsLoadingPromise;

    productsLoadingPromise = (async () => {
        const cached = getProductsFromStorage();

        if (cached.length) {
            saveProductsToLocalCache(cached);
        } else {
            saveProductsToLocalCache(DEFAULT_PRODUCTS);
        }

        await loadProductsFromSupabaseAndApply();
        return products;
    })();

    return productsLoadingPromise;
}

async function refreshProductsFromSupabase() {
    return await loadProductsFromSupabaseAndApply();
}

function refreshProductsFromStorage() {
    products = getProductsFromStorage();
    window.products = products;

    refreshProductsFromSupabase().catch(error => {
        console.error("Не вдалося оновити товари з Supabase", error);
    });

    return products;
}

async function saveProducts() {
    const normalized = Array.isArray(products)
        ? products.map((item, index) => normalizeProduct(item, item?.id || `prod_${index + 1}`))
        : [];

    saveProductsToLocalCache(normalized);

    try {
        await upsertProductsToSupabase(normalized);
        await refreshProductsFromSupabase();
    } catch (error) {
        console.error("Помилка синхронізації товарів із Supabase:", error);
        throw error;
    }

    return products;
}

async function deleteProductFromSupabase(id) {
    const client = await ensureSupabaseLoaded();

    const { error } = await client
        .from(SUPABASE_PRODUCTS_CONFIG.table)
        .delete()
        .eq("id", String(id));

    if (error) throw error;

    products = products.filter(product => String(product.id) !== String(id));
    saveProductsToLocalCache(products);
    return products;
}

async function saveSingleProductToSupabase(product) {
    const client = await ensureSupabaseLoaded();
    const payload = buildSupabaseProductPayload(product);

    const { error } = await client
        .from(SUPABASE_PRODUCTS_CONFIG.table)
        .upsert(payload, { onConflict: "id" });

    if (error) throw error;

    const index = products.findIndex(item => String(item.id) === String(payload.id));
    if (index >= 0) {
        products[index] = normalizeProduct(payload, payload.id);
    } else {
        products.push(normalizeProduct(payload, payload.id));
    }

    saveProductsToLocalCache(products);
    return products;
}

function findProductById(id) {
    return products.find(item => String(item.id) === String(id)) || null;
}

window.PRODUCT_PLACEHOLDER = PRODUCT_PLACEHOLDER;
window.CATEGORIES = CATEGORIES;
window.DEFAULT_PRODUCTS = DEFAULT_PRODUCTS;
window.products = products;
window.normalizeProduct = normalizeProduct;
window.getCategoryName = getCategoryName;
window.getCategoryIcon = getCategoryIcon;
window.getSafeProductImage = getSafeProductImage;
window.getProductsFromStorage = getProductsFromStorage;
window.refreshProductsFromStorage = refreshProductsFromStorage;
window.refreshProductsFromSupabase = refreshProductsFromSupabase;
window.saveProducts = saveProducts;
window.deleteProductFromSupabase = deleteProductFromSupabase;
window.saveSingleProductToSupabase = saveSingleProductToSupabase;
window.findProductById = findProductById;
window.escapeHtml = escapeHtml;

window.addEventListener("storage", event => {
    if (event.key === PRODUCTS_CACHE_KEY) {
        products = getProductsFromStorage();
        window.products = products;
        window.dispatchEvent(new CustomEvent("products:updated", { detail: products }));

        if (typeof window.syncProductsAndRender === "function") {
            window.syncProductsAndRender(false);
        }
    }
});

initializeProducts().catch(error => {
    console.error("Помилка ініціалізації товарів:", error);
});