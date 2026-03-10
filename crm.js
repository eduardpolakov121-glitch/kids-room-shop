const SUPABASE_URL = "https://xhhzxiithajxgngmbzzd.supabase.co";
const SUPABASE_KEY = "sb_publishable_cRp6r2C_3nszludByS9V9Q_sl1QlHg5";

function normalizeOrderItems(items) {
    if (!Array.isArray(items)) return [];

    return items.map(item => ({
        id: String(item?.id || ""),
        name: String(item?.name || "Товар"),
        price: Number(item?.price || 0),
        old: Number(item?.old || item?.price || 0),
        img: typeof sanitizeProductImage === "function"
            ? sanitizeProductImage(item?.img)
            : String(item?.img || "product-placeholder.svg"),
        qty: Math.max(1, Number(item?.qty || 1)),
        category: String(item?.category || ""),
        description: String(item?.description || ""),
        is_hit: !!item?.is_hit,
        is_sale: !!item?.is_sale,
        is_new: !!item?.is_new
    }));
}

function normalizeOrderForCRM(order) {
    const firstName = String(order?.customer_first_name || "").trim();
    const lastName = String(order?.customer_last_name || "").trim();
    const fallbackName = [firstName, lastName].filter(Boolean).join(" ").trim();

    return {
        ...order,
        customer_first_name: firstName,
        customer_last_name: lastName,
        name: String(order?.name || fallbackName || "").trim(),
        phone: String(order?.phone || "").trim(),
        city: String(order?.city || "").trim(),
        delivery: String(order?.delivery || "Нова пошта").trim(),
        address: String(order?.address || "").trim(),
        items: normalizeOrderItems(order?.items),
        total: Number(order?.total || 0),
        status: String(order?.status || "Новий").trim(),
        status_group: String(order?.status_group || "new").trim(),
        operator_comment: String(order?.operator_comment || "").trim(),
        manager_comment: String(order?.manager_comment || "").trim(),
        day_bucket: Number.isFinite(Number(order?.day_bucket)) ? Number(order.day_bucket) : 0,
        source: String(order?.source || "website").trim()
    };
}

async function saveOrderCRM(order) {
    const payload = normalizeOrderForCRM(order);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            Prefer: "return=representation"
        },
        body: JSON.stringify(payload)
    });

    const text = await response.text();

    if (!response.ok) {
        console.error("CRM INSERT ERROR:", text);
        throw new Error(text || "Помилка збереження замовлення в CRM");
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

async function getOrdersCRM() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc`, {
        method: "GET",
        headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
        }
    });

    const text = await response.text();

    if (!response.ok) {
        console.error("CRM LOAD ERROR:", text);
        throw new Error(text || "Помилка завантаження замовлень з CRM");
    }

    try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed)
            ? parsed.map(order => ({
                ...order,
                items: normalizeOrderItems(order?.items)
            }))
            : [];
    } catch {
        return [];
    }
}

async function updateOrderStatusCRM(id, status, statusGroup = null, dayBucket = null) {
    const patch = {
        status: String(status || "").trim()
    };

    if (statusGroup !== null) patch.status_group = String(statusGroup || "").trim();
    if (dayBucket !== null) patch.day_bucket = Number(dayBucket || 0);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            Prefer: "return=representation"
        },
        body: JSON.stringify(patch)
    });

    const text = await response.text();

    if (!response.ok) {
        console.error("CRM STATUS ERROR:", text);
        throw new Error(text || "Помилка оновлення статусу");
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

async function updateOrderCommentCRM(id, operatorComment, managerComment = null) {
    const payload = {
        operator_comment: operatorComment || ""
    };

    if (managerComment !== null) {
        payload.manager_comment = managerComment || "";
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            Prefer: "return=representation"
        },
        body: JSON.stringify(payload)
    });

    const text = await response.text();

    if (!response.ok) {
        console.error("CRM COMMENT ERROR:", text);
        throw new Error(text || "Помилка оновлення коментаря");
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

async function deleteOrderCRM(id) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
        }
    });

    const text = await response.text();

    if (!response.ok) {
        console.error("CRM DELETE ERROR:", text);
        throw new Error(text || "Помилка видалення замовлення");
    }

    return true;
}

window.normalizeOrderForCRM = normalizeOrderForCRM;
window.saveOrderCRM = saveOrderCRM;
window.getOrdersCRM = getOrdersCRM;
window.updateOrderStatusCRM = updateOrderStatusCRM;
window.updateOrderCommentCRM = updateOrderCommentCRM;
window.deleteOrderCRM = deleteOrderCRM;