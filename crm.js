const SUPABASE_URL = "https://xhhzxiithajxgngmbzzd.supabase.co";
const SUPABASE_KEY = "sb_publishable_cRp6r2C_3nszludByS9V9Q_sl1QlHg5";

function normalizeOrderForCRM(order) {
    return {
        ...order,
        status: order.status || "Новий",
        status_group: order.status_group || "new",
        operator_comment: order.operator_comment || "",
        manager_comment: order.manager_comment || "",
        day_bucket: Number.isFinite(Number(order.day_bucket)) ? Number(order.day_bucket) : 0,
        source: order.source || "website"
    };
}

/* ЗБЕРЕГТИ ЗАМОВЛЕННЯ В CRM */
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
        throw new Error(text);
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

/* ОТРИМАТИ ВСІ ЗАМОВЛЕННЯ */
async function getOrdersCRM() {
    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc`,
        {
            method: "GET",
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`
            }
        }
    );

    const text = await response.text();

    if (!response.ok) {
        console.error("CRM LOAD ERROR:", text);
        throw new Error(text);
    }

    try {
        return JSON.parse(text);
    } catch {
        return [];
    }
}

/* ОНОВИТИ СТАТУС */
async function updateOrderStatusCRM(id, status, statusGroup = null, dayBucket = null) {
    const patch = { status };

    if (statusGroup !== null) patch.status_group = statusGroup;
    if (dayBucket !== null) patch.day_bucket = dayBucket;

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                Prefer: "return=representation"
            },
            body: JSON.stringify(patch)
        }
    );

    const text = await response.text();

    if (!response.ok) {
        console.error("CRM STATUS ERROR:", text);
        throw new Error(text);
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

async function updateOrderCommentCRM(id, operatorComment, managerComment = null) {
    const payload = { operator_comment: operatorComment || "" };
    if (managerComment !== null) payload.manager_comment = managerComment || "";

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                Prefer: "return=representation"
            },
            body: JSON.stringify(payload)
        }
    );

    const text = await response.text();

    if (!response.ok) {
        console.error("CRM COMMENT ERROR:", text);
        throw new Error(text);
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

/* ВИДАЛИТИ ЗАМОВЛЕННЯ */
async function deleteOrderCRM(id) {
    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`,
        {
            method: "DELETE",
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`
            }
        }
    );

    const text = await response.text();

    if (!response.ok) {
        console.error("CRM DELETE ERROR:", text);
        throw new Error(text);
    }

    return true;
}
