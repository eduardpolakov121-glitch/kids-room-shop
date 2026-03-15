const SUPABASE_URL = "https://xhhzxiithajxgngmbzzd.supabase.co";
const SUPABASE_KEY = "sb_publishable_cRp6r2C_3nszludByS9V9Q_sl1QlHg5";

function normalizeOrderForCRM(order) {
    const safeOrder = order || {};

    return {
        ...safeOrder,
        customer_first_name: String(safeOrder.customer_first_name || "").trim(),
        customer_last_name: String(safeOrder.customer_last_name || "").trim(),
        name: String(safeOrder.name || "").trim(),
        phone: String(safeOrder.phone || "").trim(),
        city: String(safeOrder.city || "").trim(),
        delivery: String(safeOrder.delivery || "").trim(),
        address: String(safeOrder.address || "").trim(),
        items: Array.isArray(safeOrder.items) ? safeOrder.items : [],
        total: Number.isFinite(Number(safeOrder.total)) ? Number(safeOrder.total) : 0,
        status: String(safeOrder.status || "Новий").trim(),
        status_group: String(safeOrder.status_group || "new").trim(),
        operator_comment: String(safeOrder.operator_comment || "").trim(),
        manager_comment: String(safeOrder.manager_comment || "").trim(),
        day_bucket: Number.isFinite(Number(safeOrder.day_bucket)) ? Number(safeOrder.day_bucket) : 0,
        source: String(safeOrder.source || "website").trim()
    };
}

async function crmRequest(path, options = {}) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        method: options.method || "GET",
        headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            ...(options.headers || {})
        },
        body: options.body ? JSON.stringify(options.body) : undefined
    });

    const text = await response.text();

    if (!response.ok) {
        console.error("CRM REQUEST ERROR:", text);
        throw new Error(text || "Помилка запиту до CRM");
    }

    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

async function saveOrderCRM(order) {
    const payload = normalizeOrderForCRM(order);

    return await crmRequest("orders", {
        method: "POST",
        headers: {
            Prefer: "return=representation"
        },
        body: payload
    });
}

async function getOrdersCRM() {
    const result = await crmRequest("orders?select=*&order=created_at.desc", {
        method: "GET"
    });

    return Array.isArray(result) ? result : [];
}

async function getOrderByIdCRM(id) {
    if (!id) throw new Error("Не передано ID замовлення");

    const result = await crmRequest(`orders?id=eq.${encodeURIComponent(id)}&select=*`, {
        method: "GET"
    });

    return Array.isArray(result) && result.length ? result[0] : null;
}

async function updateOrderStatusCRM(id, status, statusGroup = null, dayBucket = null) {
    if (!id) throw new Error("Не передано ID замовлення");

    const patch = {
        status: String(status || "Новий").trim()
    };

    if (statusGroup !== null) {
        patch.status_group = String(statusGroup || "").trim();
    }

    if (dayBucket !== null) {
        patch.day_bucket = Number.isFinite(Number(dayBucket)) ? Number(dayBucket) : 0;
    }

    return await crmRequest(`orders?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
            Prefer: "return=representation"
        },
        body: patch
    });
}

async function updateOrderCommentCRM(id, operatorComment, managerComment = null) {
    if (!id) throw new Error("Не передано ID замовлення");

    const patch = {
        operator_comment: String(operatorComment || "").trim()
    };

    if (managerComment !== null) {
        patch.manager_comment = String(managerComment || "").trim();
    }

    return await crmRequest(`orders?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
            Prefer: "return=representation"
        },
        body: patch
    });
}

async function updateOrderCRM(id, fields = {}) {
    if (!id) throw new Error("Не передано ID замовлення");

    const patch = {};

    if ("status" in fields) patch.status = String(fields.status || "Новий").trim();
    if ("status_group" in fields) patch.status_group = String(fields.status_group || "new").trim();
    if ("operator_comment" in fields) patch.operator_comment = String(fields.operator_comment || "").trim();
    if ("manager_comment" in fields) patch.manager_comment = String(fields.manager_comment || "").trim();
    if ("day_bucket" in fields) patch.day_bucket = Number.isFinite(Number(fields.day_bucket)) ? Number(fields.day_bucket) : 0;
    if ("phone" in fields) patch.phone = String(fields.phone || "").trim();
    if ("city" in fields) patch.city = String(fields.city || "").trim();
    if ("delivery" in fields) patch.delivery = String(fields.delivery || "").trim();
    if ("address" in fields) patch.address = String(fields.address || "").trim();
    if ("name" in fields) patch.name = String(fields.name || "").trim();
    if ("customer_first_name" in fields) patch.customer_first_name = String(fields.customer_first_name || "").trim();
    if ("customer_last_name" in fields) patch.customer_last_name = String(fields.customer_last_name || "").trim();
    if ("source" in fields) patch.source = String(fields.source || "website").trim();
    if ("total" in fields) patch.total = Number.isFinite(Number(fields.total)) ? Number(fields.total) : 0;
    if ("items" in fields) patch.items = Array.isArray(fields.items) ? fields.items : [];

    return await crmRequest(`orders?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
            Prefer: "return=representation"
        },
        body: patch
    });
}

async function deleteOrderCRM(id) {
    if (!id) throw new Error("Не передано ID замовлення");

    await crmRequest(`orders?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE"
    });

    return true;
}

window.normalizeOrderForCRM = normalizeOrderForCRM;
window.saveOrderCRM = saveOrderCRM;
window.getOrdersCRM = getOrdersCRM;
window.getOrderByIdCRM = getOrderByIdCRM;
window.updateOrderStatusCRM = updateOrderStatusCRM;
window.updateOrderCommentCRM = updateOrderCommentCRM;
window.updateOrderCRM = updateOrderCRM;
window.deleteOrderCRM = deleteOrderCRM;