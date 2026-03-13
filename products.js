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

const SUPABASE_PRODUCTS_CONFIG = {
    url: "https://xhhzxiithajxgngmbzzd.supabase.co",
    anonKey: "sb_publishable_cRp6r2C_3nszludByS9V9Q_sl1QlHg5",
    table: "products"
};

const PRODUCTS_CACHE_KEY = "products";
const PRODUCTS_INIT_FLAG_KEY = "kids_room_products_seeded_v3";

let products = [];
let supabaseClientInstance = null;
let productsReady = false;
let productsInitPromise = null;

function buildDefaultProducts() {
    const make = (category, items) =>
        items.map((item, index) => ({
            id: `${category}-${index + 1}`,
            name: item.name,
            category,
            price: item.price,
            old: item.old,
            description: item.description,
            img: PRODUCT_PLACEHOLDER,
            is_hit: !!item.is_hit,
            is_sale: !!item.is_sale,
            is_new: !!item.is_new
        }));

    return [
        ...make("toy", [
            { name: "Плюшевий ведмедик", price: 350, old: 450, description: "М'яка іграшка для обіймів та затишних ігор.", is_hit: true, is_sale: true },
            { name: "Іграшка 2", price: 390, old: 490, description: "Яскрава дитяча іграшка для щоденних веселих ігор.", is_new: true },
            { name: "Іграшка 3", price: 420, old: 520, description: "Безпечна іграшка для розвитку фантазії дитини." },
            { name: "Іграшка 4", price: 460, old: 560, description: "Міцна та приємна на дотик іграшка для малюків." },
            { name: "Іграшка 5", price: 510, old: 620, description: "Іграшка для веселого дозвілля вдома та в дорозі." },
            { name: "Іграшка 6", price: 540, old: 650, description: "Легка іграшка для гри та сенсорного розвитку." },
            { name: "Іграшка 7", price: 580, old: 690, description: "Красива іграшка для подарунка дитині." },
            { name: "Іграшка 8", price: 620, old: 740, description: "Барвиста іграшка для активних дитячих ігор." },
            { name: "Іграшка 9", price: 680, old: 790, description: "Цікава іграшка, що додає радості щодня." },
            { name: "Іграшка 10", price: 740, old: 860, description: "Популярна іграшка для домашнього дозвілля." }
        ]),
        ...make("stroller", [
            { name: "Коляска 1", price: 3500, old: 4200, description: "Легка прогулянкова коляска для щоденних прогулянок.", is_hit: true },
            { name: "Коляска 2", price: 3900, old: 4600, description: "Зручна дитяча коляска з м'яким ходом.", is_sale: true },
            { name: "Коляска 3", price: 4300, old: 5000, description: "Практична модель для міста та подорожей.", is_new: true },
            { name: "Коляска 4", price: 4700, old: 5500, description: "Стабільна коляска для комфортних прогулянок." },
            { name: "Коляска 5", price: 5200, old: 6100, description: "Модель із просторим сидінням для малюка." },
            { name: "Коляска 6", price: 5600, old: 6500, description: "Коляска з хорошою амортизацією та легкою рамою." },
            { name: "Коляска 7", price: 6100, old: 7000, description: "Надійна прогулянкова коляска на кожен день." },
            { name: "Коляска 8", price: 6700, old: 7600, description: "Функціональна модель для міських прогулянок." },
            { name: "Коляска 9", price: 7200, old: 8200, description: "Містка та зручна коляска для дитини." },
            { name: "Коляска 10", price: 7900, old: 9000, description: "Сучасна коляска з комфортною посадкою." }
        ]),
        ...make("seat", [
            { name: "Автокрісло 1", price: 1800, old: 2200, description: "Надійне автокрісло для безпечних поїздок.", is_hit: true },
            { name: "Автокрісло 2", price: 2100, old: 2500, description: "Комфортне автокрісло для щоденного використання." },
            { name: "Автокрісло 3", price: 2400, old: 2850, description: "Модель із зручними бічними захистами.", is_sale: true },
            { name: "Автокрісло 4", price: 2700, old: 3200, description: "Практичне рішення для коротких і довгих поїздок.", is_new: true },
            { name: "Автокрісло 5", price: 3000, old: 3550, description: "Сучасне автокрісло з м'якою вкладкою." },
            { name: "Автокрісло 6", price: 3400, old: 3950, description: "Ергономічна модель для дитини різного віку." },
            { name: "Автокрісло 7", price: 3800, old: 4400, description: "Безпечне та зручне крісло для авто." },
            { name: "Автокрісло 8", price: 4200, old: 4850, description: "Модель із надійним кріпленням та комфортом." },
            { name: "Автокрісло 9", price: 4700, old: 5400, description: "Продумане автокрісло для щоденних поїздок." },
            { name: "Автокрісло 10", price: 5200, old: 5900, description: "Преміальна модель із високим рівнем захисту." }
        ]),
        ...make("clothes", [
            { name: "Дитячий костюм 1", price: 450, old: 560, description: "М'який комплект одягу для щоденного носіння.", is_sale: true },
            { name: "Дитячий костюм 2", price: 490, old: 600, description: "Зручний набір одягу для дому та прогулянок.", is_new: true },
            { name: "Дитячий костюм 3", price: 530, old: 650, description: "Практичний одяг із приємної тканини.", is_hit: true },
            { name: "Дитячий костюм 4", price: 580, old: 700, description: "Якісний комплект для активної дитини." },
            { name: "Дитячий костюм 5", price: 620, old: 760, description: "Легкий одяг для садочка та прогулянок." },
            { name: "Дитячий костюм 6", price: 680, old: 810, description: "Комфортний комплект на кожен день." },
            { name: "Дитячий костюм 7", price: 730, old: 860, description: "Яскравий дитячий одяг із зручним кроєм." },
            { name: "Дитячий костюм 8", price: 790, old: 930, description: "Стильний комплект для хлопчика або дівчинки." },
            { name: "Дитячий костюм 9", price: 840, old: 980, description: "Приємний на дотик комплект для дитини." },
            { name: "Дитячий костюм 10", price: 890, old: 1050, description: "Практичний одяг для щоденних активностей." }
        ]),
        ...make("transport", [
            { name: "Дитячий транспорт 1", price: 900, old: 1100, description: "Легкий транспорт для веселих прогулянок.", is_sale: true },
            { name: "Дитячий транспорт 2", price: 1100, old: 1320, description: "Надійна модель для активного катання." },
            { name: "Дитячий транспорт 3", price: 1300, old: 1560, description: "Яскравий транспорт для ігор надворі.", is_new: true },
            { name: "Дитячий транспорт 4", price: 1500, old: 1780, description: "Стійка модель для дітей різного віку.", is_hit: true },
            { name: "Дитячий транспорт 5", price: 1750, old: 2050, description: "Зручний транспорт для щоденного дозвілля." },
            { name: "Дитячий транспорт 6", price: 1950, old: 2280, description: "Міцна конструкція та плавний хід." },
            { name: "Дитячий транспорт 7", price: 2200, old: 2550, description: "Безпечний варіант для прогулянок." },
            { name: "Дитячий транспорт 8", price: 2450, old: 2820, description: "Функціональна модель для вулиці." },
            { name: "Дитячий транспорт 9", price: 2700, old: 3090, description: "Сучасний транспорт для маленьких дослідників." },
            { name: "Дитячий транспорт 10", price: 2950, old: 3380, description: "Комфортна модель для тривалого використання." }
        ]),
        ...make("sorter", [
            { name: "Сортер 1", price: 400, old: 520, description: "Розвиває моторику, увагу та логіку дитини.", is_hit: true },
            { name: "Сортер 2", price: 430, old: 550, description: "Яскравий сортер для раннього розвитку." },
            { name: "Сортер 3", price: 470, old: 590, description: "Навчальна іграшка для координації рухів.", is_new: true },
            { name: "Сортер 4", price: 510, old: 640, description: "Безпечний сортер із цікавими формами.", is_sale: true },
            { name: "Сортер 5", price: 550, old: 690, description: "Розвиваюча іграшка для малюків." },
            { name: "Сортер 6", price: 590, old: 740, description: "Дерев'яний сортер для пізнавальних ігор." },
            { name: "Сортер 7", price: 630, old: 790, description: "Практичний сортер для навчання кольорам." },
            { name: "Сортер 8", price: 680, old: 840, description: "Іграшка для розвитку мислення та моторики." },
            { name: "Сортер 9", price: 730, old: 900, description: "Надійна модель для раннього навчання." },
            { name: "Сортер 10", price: 780, old: 960, description: "Популярний сортер для домашніх занять." }
        ]),
        ...make("baby", [
            { name: "Товар для немовлят 1", price: 260, old: 330, description: "Корисний товар для щоденного догляду за малюком." },
            { name: "Товар для немовлят 2", price: 290, old: 360, description: "Зручний аксесуар для першого року життя.", is_hit: true },
            { name: "Товар для немовлят 3", price: 320, old: 390, description: "Практичний товар для комфорту малюка." },
            { name: "Товар для немовлят 4", price: 360, old: 440, description: "Якісний товар для догляду та зручності." },
            { name: "Товар для немовлят 5", price: 390, old: 470, description: "Безпечне рішення для щоденного використання.", is_sale: true },
            { name: "Товар для немовлят 6", price: 430, old: 520, description: "Продуманий товар для найменших.", is_new: true },
            { name: "Товар для немовлят 7", price: 470, old: 560, description: "М'який і комфортний аксесуар для малюка." },
            { name: "Товар для немовлят 8", price: 520, old: 620, description: "Практичний товар для батьків і дитини." },
            { name: "Товар для немовлят 9", price: 580, old: 690, description: "Надійний товар для щоденних потреб." },
            { name: "Товар для немовлят 10", price: 640, old: 760, description: "Зручний товар для догляду за дитиною." }
        ]),
        ...make("school", [
            { name: "Шкільний товар 1", price: 180, old: 240, description: "Практичний товар для навчання та школи." },
            { name: "Шкільний товар 2", price: 220, old: 280, description: "Корисна річ для щоденного навчального процесу.", is_new: true },
            { name: "Шкільний товар 3", price: 260, old: 320, description: "Якісний товар для школи та занять." },
            { name: "Шкільний товар 4", price: 300, old: 370, description: "Зручний аксесуар для навчання." },
            { name: "Шкільний товар 5", price: 340, old: 410, description: "Практичний товар для школяра.", is_hit: true },
            { name: "Шкільний товар 6", price: 390, old: 470, description: "Надійний і корисний товар для занять.", is_sale: true },
            { name: "Шкільний товар 7", price: 450, old: 540, description: "Функціональний шкільний аксесуар." },
            { name: "Шкільний товар 8", price: 510, old: 610, description: "Зручний товар для уроків і гуртків." },
            { name: "Шкільний товар 9", price: 580, old: 690, description: "Практична річ для щоденного навчання." },
            { name: "Шкільний товар 10", price: 650, old: 770, description: "Популярний товар для школярів." }
        ]),
        ...make("furniture", [
            { name: "Дитячі меблі 1", price: 1200, old: 1450, description: "Практичні меблі для дитячої кімнати." },
            { name: "Дитячі меблі 2", price: 1450, old: 1720, description: "Зручний елемент інтер'єру для дитини." },
            { name: "Дитячі меблі 3", price: 1700, old: 1990, description: "Якісні меблі для ігор і відпочинку.", is_hit: true },
            { name: "Дитячі меблі 4", price: 1950, old: 2280, description: "Функціональна модель для дитячої кімнати." },
            { name: "Дитячі меблі 5", price: 2250, old: 2620, description: "Надійні меблі для щоденного використання.", is_sale: true },
            { name: "Дитячі меблі 6", price: 2550, old: 2960, description: "Продумане рішення для кімнати малюка.", is_new: true },
            { name: "Дитячі меблі 7", price: 2850, old: 3300, description: "Стійка та красива модель для дитячої." },
            { name: "Дитячі меблі 8", price: 3200, old: 3690, description: "Зручні меблі для сучасної дитячої кімнати." },
            { name: "Дитячі меблі 9", price: 3600, old: 4140, description: "Модель для комфортного простору дитини." },
            { name: "Дитячі меблі 10", price: 4100, old: 4700, description: "Практичне меблеве рішення для дому." }
        ]),
        ...make("feeding", [
            { name: "Товар для годування 1", price: 210, old: 270, description: "Зручний товар для годування малюка." },
            { name: "Товар для годування 2", price: 240, old: 300, description: "Практичний аксесуар для щоденного використання." },
            { name: "Товар для годування 3", price: 280, old: 350, description: "Корисний товар для комфортного годування." },
            { name: "Товар для годування 4", price: 320, old: 390, description: "Якісний аксесуар для дитячого харчування.", is_new: true },
            { name: "Товар для годування 5", price: 360, old: 440, description: "Безпечний товар для щоденного догляду." },
            { name: "Товар для годування 6", price: 410, old: 500, description: "Продуманий товар для годування вдома." },
            { name: "Товар для годування 7", price: 460, old: 560, description: "Надійний помічник для батьків.", is_hit: true },
            { name: "Товар для годування 8", price: 520, old: 630, description: "Комфортний товар для прийому їжі.", is_sale: true },
            { name: "Товар для годування 9", price: 590, old: 710, description: "Функціональний аксесуар для годування." },
            { name: "Товар для годування 10", price: 660, old: 790, description: "Популярний товар для маленьких дітей." }
        ]),
        ...make("hygiene", [
            { name: "Товар для гігієни 1", price: 140, old: 190, description: "Практичний товар для дитячої гігієни." },
            { name: "Товар для гігієни 2", price: 170, old: 220, description: "Зручний товар для щоденного догляду." },
            { name: "Товар для гігієни 3", price: 200, old: 260, description: "Якісний аксесуар для чистоти та комфорту." },
            { name: "Товар для гігієни 4", price: 240, old: 300, description: "Безпечний товар для маленької дитини.", is_sale: true },
            { name: "Товар для гігієни 5", price: 280, old: 350, description: "Корисний товар для щоденного використання." },
            { name: "Товар для гігієни 6", price: 320, old: 390, description: "Практичне рішення для батьків.", is_new: true },
            { name: "Товар для гігієни 7", price: 370, old: 450, description: "Надійний товар для дитячого догляду.", is_hit: true },
            { name: "Товар для гігієни 8", price: 420, old: 510, description: "Комфортний аксесуар для чистоти." },
            { name: "Товар для гігієни 9", price: 480, old: 580, description: "Функціональний товар для малюків." },
            { name: "Товар для гігієни 10", price: 540, old: 650, description: "Популярний товар для щоденного догляду." }
        ]),
        ...make("bedding", [
            { name: "Постіль 1", price: 520, old: 640, description: "М'яка дитяча постіль для комфортного сну." },
            { name: "Постіль 2", price: 580, old: 710, description: "Якісний комплект для дитячого ліжечка." },
            { name: "Постіль 3", price: 640, old: 780, description: "Практична постіль для щоденного використання." },
            { name: "Постіль 4", price: 710, old: 860, description: "Затишний комплект для дитячої кімнати.", is_new: true },
            { name: "Постіль 5", price: 790, old: 950, description: "М'яка тканина та приємний дизайн.", is_hit: true },
            { name: "Постіль 6", price: 860, old: 1030, description: "Комфортна постіль для спокійного відпочинку.", is_sale: true },
            { name: "Постіль 7", price: 940, old: 1120, description: "Зручний комплект для кожного дня." },
            { name: "Постіль 8", price: 1030, old: 1220, description: "Приємний на дотик комплект для дитини." },
            { name: "Постіль 9", price: 1120, old: 1320, description: "Якісна постіль для дитячого ліжка." },
            { name: "Постіль 10", price: 1230, old: 1440, description: "Популярний комплект для затишної кімнати." }
        ]),
        ...make("creativity", [
            { name: "Товар для творчості 1", price: 160, old: 210, description: "Набір для розвитку творчих здібностей." },
            { name: "Товар для творчості 2", price: 190, old: 240, description: "Яскравий товар для малювання та занять." },
            { name: "Товар для творчості 3", price: 220, old: 280, description: "Корисний товар для рукоділля та навчання." },
            { name: "Товар для творчості 4", price: 260, old: 320, description: "Зручний набір для дитячої творчості." },
            { name: "Товар для творчості 5", price: 300, old: 370, description: "Практичний товар для домашніх занять.", is_hit: true },
            { name: "Товар для творчості 6", price: 340, old: 420, description: "Якісний товар для розвитку уяви.", is_sale: true },
            { name: "Товар для творчості 7", price: 390, old: 480, description: "Цікавий набір для веселих творчих ігор.", is_new: true },
            { name: "Товар для творчості 8", price: 450, old: 550, description: "Популярний товар для дитячого хобі." },
            { name: "Товар для творчості 9", price: 520, old: 630, description: "Натхненний набір для розвитку фантазії." },
            { name: "Товар для творчості 10", price: 590, old: 710, description: "Функціональний товар для творчих занять." }
        ])
    ];
}

const DEFAULT_PRODUCTS = buildDefaultProducts();

function toBool(value) {
    return value === true || value === "true" || value === 1 || value === "1";
}

function sanitizeProductImage(url) {
    const value = String(url || "").trim();

    if (!value) return PRODUCT_PLACEHOLDER;
    if (value === PRODUCT_PLACEHOLDER) return PRODUCT_PLACEHOLDER;

    const lower = value.toLowerCase();

    if (
        lower.startsWith("http://") ||
        lower.startsWith("https://") ||
        lower.startsWith("./") ||
        lower.startsWith("../") ||
        lower.startsWith("/") ||
        lower.startsWith("data:image/") ||
        lower === "product-placeholder.svg"
    ) {
        return value;
    }

    return PRODUCT_PLACEHOLDER;
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
        img: sanitizeProductImage(raw?.img),
        is_hit: toBool(raw?.is_hit),
        is_sale: toBool(raw?.is_sale),
        is_new: toBool(raw?.is_new)
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

function setProductsState(list, emitEvent = true) {
    products = Array.isArray(list)
        ? list.map((item, index) => normalizeProduct(item, item?.id || `prod_${index + 1}`))
        : [];

    window.products = products;
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products));

    if (emitEvent) {
        window.dispatchEvent(new CustomEvent("products:updated", { detail: products }));
    }

    return products;
}

async function ensureSupabaseLoaded() {
    if (supabaseClientInstance) return supabaseClientInstance;

    if (!window.supabase || typeof window.supabase.createClient !== "function") {
        await new Promise((resolve, reject) => {
            const existing = document.querySelector('script[data-kids-room-supabase="true"]');
            if (existing) {
                existing.addEventListener("load", resolve, { once: true });
                existing.addEventListener("error", reject, { once: true });
                return;
            }

            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
            script.async = true;
            script.defer = true;
            script.dataset.kidsRoomSupabase = "true";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    supabaseClientInstance = window.supabase.createClient(
        SUPABASE_PRODUCTS_CONFIG.url,
        SUPABASE_PRODUCTS_CONFIG.anonKey
    );

    return supabaseClientInstance;
}

async function fetchProductsFromSupabase() {
    const client = await ensureSupabaseLoaded();

    const { data, error } = await client
        .from(SUPABASE_PRODUCTS_CONFIG.table)
        .select("id, name, category, price, old, description, img, is_hit, is_sale, is_new")
        .order("id", { ascending: true });

    if (error) throw error;

    return Array.isArray(data)
        ? data.map((item, index) => normalizeProduct(item, item?.id || `prod_${index + 1}`))
        : [];
}

async function replaceAllProductsInSupabase(list) {
    const client = await ensureSupabaseLoaded();
    const normalized = Array.isArray(list)
        ? list.map((item, index) => normalizeProduct(item, item?.id || `prod_${index + 1}`))
        : [];

    const { data: existingRows, error: existingError } = await client
        .from(SUPABASE_PRODUCTS_CONFIG.table)
        .select("id");

    if (existingError) throw existingError;

    const existingIds = Array.isArray(existingRows) ? existingRows.map(item => String(item.id)) : [];
    const nextIds = normalized.map(item => String(item.id));
    const idsToDelete = existingIds.filter(id => !nextIds.includes(id));

    if (idsToDelete.length) {
        const { error: deleteError } = await client
            .from(SUPABASE_PRODUCTS_CONFIG.table)
            .delete()
            .in("id", idsToDelete);

        if (deleteError) throw deleteError;
    }

    if (normalized.length) {
        const { error: upsertError } = await client
            .from(SUPABASE_PRODUCTS_CONFIG.table)
            .upsert(normalized, { onConflict: "id" });

        if (upsertError) throw upsertError;
    }

    return normalized;
}

async function saveProducts() {
    const snapshot = Array.isArray(products) ? [...products] : [];
    setProductsState(snapshot, true);
    await replaceAllProductsInSupabase(snapshot);
    return products;
}

async function saveSingleProductToSupabase(product) {
    const normalized = normalizeProduct(product, product?.id);
    const index = products.findIndex(item => String(item.id) === String(normalized.id));

    if (index >= 0) {
        products[index] = normalized;
    } else {
        products.push(normalized);
    }

    setProductsState(products, true);
    await replaceAllProductsInSupabase(products);
    return products;
}

async function deleteProductFromSupabase(id) {
    products = products.filter(item => String(item.id) !== String(id));
    setProductsState(products, true);
    await replaceAllProductsInSupabase(products);
    return products;
}

async function seedDefaultProductsIfNeeded() {
    const seeded = localStorage.getItem(PRODUCTS_INIT_FLAG_KEY) === "true";

    let remoteProducts = [];
    try {
        remoteProducts = await fetchProductsFromSupabase();
    } catch (error) {
        console.error("Помилка читання товарів із Supabase:", error);
    }

    if (remoteProducts.length > 0) {
        setProductsState(remoteProducts, false);
        return remoteProducts;
    }

    if (!seeded) {
        await replaceAllProductsInSupabase(DEFAULT_PRODUCTS);
        localStorage.setItem(PRODUCTS_INIT_FLAG_KEY, "true");
    }

    const afterSeed = await fetchProductsFromSupabase();
    setProductsState(afterSeed.length ? afterSeed : DEFAULT_PRODUCTS, false);
    return products;
}

async function initializeProducts() {
    if (productsInitPromise) return productsInitPromise;

    productsInitPromise = (async () => {
        const cached = getProductsFromStorage();
        if (cached.length) {
            setProductsState(cached, false);
        } else {
            setProductsState(DEFAULT_PRODUCTS, false);
        }

        try {
            await seedDefaultProductsIfNeeded();
        } catch (error) {
            console.error("Помилка ініціалізації товарів:", error);
        }

        productsReady = true;
        window.products = products;
        window.dispatchEvent(new CustomEvent("products:ready", { detail: products }));
        return products;
    })();

    return productsInitPromise;
}

function refreshProductsFromStorage() {
    return products;
}

async function refreshProductsFromSupabase() {
    try {
        const remoteProducts = await fetchProductsFromSupabase();
        if (remoteProducts.length) {
            setProductsState(remoteProducts, true);
        }
        return products;
    } catch (error) {
        console.error("Не вдалося оновити товари з Supabase", error);
        return products;
    }
}

function findProductById(id) {
    return products.find(item => String(item.id) === String(id)) || null;
}

window.PRODUCT_PLACEHOLDER = PRODUCT_PLACEHOLDER;
window.CATEGORIES = CATEGORIES;
window.DEFAULT_PRODUCTS = DEFAULT_PRODUCTS;
window.products = products;
window.productsReady = () => productsReady;
window.initializeProducts = initializeProducts;
window.refreshProductsFromStorage = refreshProductsFromStorage;
window.refreshProductsFromSupabase = refreshProductsFromSupabase;
window.normalizeProduct = normalizeProduct;
window.getCategoryName = getCategoryName;
window.getCategoryIcon = getCategoryIcon;
window.getSafeProductImage = getSafeProductImage;
window.saveProducts = saveProducts;
window.saveSingleProductToSupabase = saveSingleProductToSupabase;
window.deleteProductFromSupabase = deleteProductFromSupabase;
window.findProductById = findProductById;
window.sanitizeProductImage = sanitizeProductImage;

window.addEventListener("storage", event => {
    if (event.key === PRODUCTS_CACHE_KEY) {
        const cached = getProductsFromStorage();
        setProductsState(cached, true);
    }
});

initializeProducts().catch(error => {
    console.error(error);
});