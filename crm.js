const SUPABASE_URL = "https://xhhzxiithajxgngmbzzd.supabase.co";
const SUPABASE_KEY = "sb_publishable_cRp6r2C_3nszludByS9V9Q_sl1QlHg5";

/* =========================
   CRM HELPERS
========================= */

function safeString(value, fallback = "") {
    return String(value ?? fallback).trim();
}

function safeNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function safeArray(value) {
    return Array.isArray(value) ? value : [];
}

function calculateOrderTotal(items) {
    return safeArray(items).reduce((sum, item) => {
        return sum + safeNumber(item.price) * safeNumber(item.qty);
    }, 0);
}

function calculateOrderQty(items) {
    return safeArray(items).reduce((sum, item) => {
        return sum + safeNumber(item.qty);
    }, 0);
}

function normalizeOrderItems(items) {
    return safeArray(items).map(item => {
        return {
            id: safeString(item.id),
            name: safeString(item.name, "Товар"),
            price: safeNumber(item.price),
            qty: safeNumber(item.qty, 1),
            img: safeString(item.img || item.image || ""),
            category: safeString(item.category || ""),
            description: safeString(item.description || ""),
            old: safeNumber(item.old || 0),
            stock_status: safeString(item.stock_status || "in_stock")
        };
    });
}

/* =========================
   NORMALIZE ORDER
========================= */

function normalizeOrderForCRM(order) {
    const safeOrder = order || {};
    const items = normalizeOrderItems(safeOrder.items);

    const calculatedTotal = calculateOrderTotal(items);
    const calculatedQty = calculateOrderQty(items);

    const firstName = safeString(safeOrder.customer_first_name);
    const lastName = safeString(safeOrder.customer_last_name);
    const fullName = safeString(safeOrder.name || `${firstName} ${lastName}`);

    return {
        customer_first_name: firstName,
        customer_last_name: lastName,
        name: fullName,
        phone: safeString(safeOrder.phone),
        city: safeString(safeOrder.city),
        delivery: safeString(safeOrder.delivery),
        address: safeString(safeOrder.address),

        items: items,
        total: safeNumber(safeOrder.total, calculatedTotal),
        total_items: safeNumber(safeOrder.total_items, calculatedQty),

        status: safeString(safeOrder.status || "Новий"),
        status_group: safeString(safeOrder.status_group || "new"),
        operator_comment: safeString(safeOrder.operator_comment),
        manager_comment: safeString(safeOrder.manager_comment),
        client_note: safeString(safeOrder.client_note),
        day_bucket: safeNumber(safeOrder.day_bucket, 0),
        source: safeString(safeOrder.source || "website"),
        ttn: safeString(safeOrder.ttn),

        created_at: safeOrder.created_at || new Date().toISOString()
    };
}

/* =========================
   SUPABASE REST REQUEST
========================= */

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

/* =========================
   CREATE ORDER
========================= */

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

/* =========================
   GET ORDERS
========================= */

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

/* =========================
   UPDATE STATUS
========================= */

async function updateOrderStatusCRM(id, status, statusGroup = null, dayBucket = null) {
    if (!id) throw new Error("Не передано ID замовлення");

    const patch = {
        status: safeString(status || "Новий")
    };

    if (statusGroup !== null) {
        patch.status_group = safeString(statusGroup || "new");
    }

    if (dayBucket !== null) {
        patch.day_bucket = safeNumber(dayBucket, 0);
    }

    return await crmRequest(`orders?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
            Prefer: "return=representation"
        },
        body: patch
    });
}

/* =========================
   UPDATE COMMENTS
========================= */

async function updateOrderCommentCRM(id, operatorComment, managerComment = null) {
    if (!id) throw new Error("Не передано ID замовлення");

    const patch = {
        operator_comment: safeString(operatorComment)
    };

    if (managerComment !== null) {
        patch.manager_comment = safeString(managerComment);
    }

    return await crmRequest(`orders?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
            Prefer: "return=representation"
        },
        body: patch
    });
}

/* =========================
   UPDATE ANY ORDER FIELDS
========================= */

async function updateOrderCRM(id, fields = {}) {
    if (!id) throw new Error("Не передано ID замовлення");

    const patch = {};

    if ("status" in fields) patch.status = safeString(fields.status || "Новий");
    if ("status_group" in fields) patch.status_group = safeString(fields.status_group || "new");
    if ("operator_comment" in fields) patch.operator_comment = safeString(fields.operator_comment);
    if ("manager_comment" in fields) patch.manager_comment = safeString(fields.manager_comment);
    if ("client_note" in fields) patch.client_note = safeString(fields.client_note);
    if ("day_bucket" in fields) patch.day_bucket = safeNumber(fields.day_bucket, 0);
    if ("phone" in fields) patch.phone = safeString(fields.phone);
    if ("city" in fields) patch.city = safeString(fields.city);
    if ("delivery" in fields) patch.delivery = safeString(fields.delivery);
    if ("address" in fields) patch.address = safeString(fields.address);
    if ("name" in fields) patch.name = safeString(fields.name);
    if ("customer_first_name" in fields) patch.customer_first_name = safeString(fields.customer_first_name);
    if ("customer_last_name" in fields) patch.customer_last_name = safeString(fields.customer_last_name);
    if ("source" in fields) patch.source = safeString(fields.source || "website");
    if ("ttn" in fields) patch.ttn = safeString(fields.ttn);
    if ("created_at" in fields) patch.created_at = fields.created_at || new Date().toISOString();

    if ("items" in fields) {
        patch.items = normalizeOrderItems(fields.items);
    }

    if ("total" in fields) {
        patch.total = safeNumber(fields.total, 0);
    } else if ("items" in fields) {
        patch.total = calculateOrderTotal(patch.items);
    }

    if ("total_items" in fields) {
        patch.total_items = safeNumber(fields.total_items, 0);
    } else if ("items" in fields) {
        patch.total_items = calculateOrderQty(patch.items);
    }

    return await crmRequest(`orders?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
            Prefer: "return=representation"
        },
        body: patch
    });
}

/* =========================
   DELETE ORDER
========================= */

async function deleteOrderCRM(id) {
    if (!id) throw new Error("Не передано ID замовлення");

    await crmRequest(`orders?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE"
    });

    return true;
}

/* =========================
   EXPORTS
========================= */

window.normalizeOrderForCRM = normalizeOrderForCRM;
window.saveOrderCRM = saveOrderCRM;
window.getOrdersCRM = getOrdersCRM;
window.getOrderByIdCRM = getOrderByIdCRM;
window.updateOrderStatusCRM = updateOrderStatusCRM;
window.updateOrderCommentCRM = updateOrderCommentCRM;
window.updateOrderCRM = updateOrderCRM;
window.deleteOrderCRM = deleteOrderCRM;