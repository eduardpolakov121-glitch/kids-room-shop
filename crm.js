const SUPABASE_URL = "https://hhvnsoxjuiadrupkvvzr.supabase.co";
const SUPABASE_KEY = "sb_publishable_wUWvPv_eztlIcBG3hbvVHQ_aiMLTr-Q";

/* ЗБЕРЕГТИ ЗАМОВЛЕННЯ В CRM */
async function saveOrderCRM(order) {
    const response = await fetch(SUPABASE_URL + "/rest/v1/orders", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_KEY,
            "Authorization": "Bearer " + SUPABASE_KEY,
            "Prefer": "return=representation"
        },
        body: JSON.stringify(order)
    });

    if (!response.ok) {
        const errorText = await response.text();
        alert("CRM ERROR: " + errorText);
        throw new Error(errorText);
    }

    return await response.json();
}

/* ОТРИМАТИ ВСІ ЗАМОВЛЕННЯ */
async function getOrdersCRM() {
    const response = await fetch(
        SUPABASE_URL + "/rest/v1/orders?select=*&order=created_at.desc",
        {
            method: "GET",
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": "Bearer " + SUPABASE_KEY
            }
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        alert("LOAD ERROR: " + errorText);
        throw new Error(errorText);
    }

    return await response.json();
}

/* ОНОВИТИ СТАТУС ЗАМОВЛЕННЯ */
async function updateOrderStatusCRM(id, status) {
    const response = await fetch(
        SUPABASE_URL + "/rest/v1/orders?id=eq." + encodeURIComponent(id),
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "apikey": SUPABASE_KEY,
                "Authorization": "Bearer " + SUPABASE_KEY,
                "Prefer": "return=representation"
            },
            body: JSON.stringify({ status: status })
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        alert("STATUS ERROR: " + errorText);
        throw new Error(errorText);
    }

    return await response.json();
}

/* ВИДАЛИТИ ЗАМОВЛЕННЯ */
async function deleteOrderCRM(id) {
    const response = await fetch(
        SUPABASE_URL + "/rest/v1/orders?id=eq." + encodeURIComponent(id),
        {
            method: "DELETE",
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": "Bearer " + SUPABASE_KEY
            }
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        alert("DELETE ERROR: " + errorText);
        throw new Error(errorText);
    }

    return true;
}