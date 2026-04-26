const SUPABASE_URL = 'https://xhhzxiithajxgngmbzzd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_cRp6r2C_3nszludByS9V9Q_sl1QlHg5';

const PRODUCT = {
  name: 'Дитячий нічник-проектор Космонавт',
  price: 599,
  oldPrice: 799,
  quantity: 1,
  source: 'landing-night-projector'
};

const form = document.getElementById('nightLightOrderForm');
const formStatus = document.getElementById('formStatus');

let isSending = false;

function setStatus(message, type = '') {
  if (!formStatus) return;

  formStatus.textContent = message;
  formStatus.className = `form-status ${type}`;
}

function normalizePhone(phone) {
  return String(phone || '')
    .replace(/[^\d+]/g, '')
    .trim();
}

function isValidUkrainianPhone(phone) {
  const cleaned = normalizePhone(phone);

  return (
    /^\+380\d{9}$/.test(cleaned) ||
    /^380\d{9}$/.test(cleaned) ||
    /^0\d{9}$/.test(cleaned)
  );
}

function formatPhone(phone) {
  const cleaned = normalizePhone(phone);

  if (/^0\d{9}$/.test(cleaned)) {
    return `+38${cleaned}`;
  }

  if (/^380\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  return cleaned;
}

function splitFullName(fullName) {
  const cleaned = String(fullName || '')
    .trim()
    .replace(/\s+/g, ' ');

  const parts = cleaned.split(' ');

  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
    fullName: cleaned
  };
}

function getSupabaseClient() {
  if (!window.supabase) {
    throw new Error('Supabase SDK не завантажився');
  }

  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function buildProductItem() {
  return {
    id: 'night-projector-cosmonaut',
    name: PRODUCT.name,
    title: PRODUCT.name,
    product_name: PRODUCT.name,
    price: PRODUCT.price,
    old_price: PRODUCT.oldPrice,
    quantity: PRODUCT.quantity,
    total: PRODUCT.price * PRODUCT.quantity,
    source: PRODUCT.source
  };
}

function buildOrderPayload(data) {
  const fullNameInput = data.get('fullName').trim();
  const phoneInput = data.get('phone').trim();

  const phone = formatPhone(phoneInput);
  const nameData = splitFullName(fullNameInput);
  const item = buildProductItem();
  const total = PRODUCT.price * PRODUCT.quantity;

  return {
    name: nameData.fullName,
    full_name: nameData.fullName,
    client_name: nameData.fullName,
    customer_name: nameData.fullName,
    contact_name: nameData.fullName,
    first_name: nameData.firstName,
    last_name: nameData.lastName,

    phone: phone,
    client_phone: phone,
    customer_phone: phone,

    delivery_service: '',
    delivery_type: '',
    city: '',
    warehouse: '',
    department: '',
    address: '',

    items: [item],
    products: [item],

    product_name: PRODUCT.name,
    product_price: PRODUCT.price,
    quantity: PRODUCT.quantity,

    total: total,
    total_price: total,
    order_total: total,
    total_items: PRODUCT.quantity,

    status: 'new',
    source: PRODUCT.source,

    client_note: `Заявка з лендингу нічника. ПІБ клієнта: ${nameData.fullName}. Телефон: ${phone}. Деталі доставки, місто та відділення заповнює оператор під час дзвінка.`,
    comment: `Заявка з лендингу нічника. ПІБ клієнта: ${nameData.fullName}. Телефон: ${phone}. Деталі доставки, місто та відділення заповнює оператор під час дзвінка.`,
    notes: `Заявка з лендингу нічника. ПІБ клієнта: ${nameData.fullName}. Телефон: ${phone}. Деталі доставки, місто та відділення заповнює оператор під час дзвінка.`,

    ttn: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function buildSafePayload(data) {
  const fullNameInput = data.get('fullName').trim();
  const phoneInput = data.get('phone').trim();

  const phone = formatPhone(phoneInput);
  const nameData = splitFullName(fullNameInput);
  const item = buildProductItem();

  return {
    name: nameData.fullName,
    full_name: nameData.fullName,
    client_name: nameData.fullName,
    customer_name: nameData.fullName,
    contact_name: nameData.fullName,
    first_name: nameData.firstName,
    last_name: nameData.lastName,

    phone: phone,
    client_phone: phone,
    customer_phone: phone,

    items: [item],
    products: [item],

    product_name: PRODUCT.name,
    product_price: PRODUCT.price,
    quantity: 1,

    total: PRODUCT.price,
    total_items: 1,
    status: 'new',
    source: PRODUCT.source,

    client_note: `Заявка з лендингу нічника. ПІБ клієнта: ${nameData.fullName}. Телефон: ${phone}. Деталі доставки заповнює оператор.`,
    comment: `Заявка з лендингу нічника. ПІБ клієнта: ${nameData.fullName}. Телефон: ${phone}. Деталі доставки заповнює оператор.`,
    notes: `Заявка з лендингу нічника. ПІБ клієнта: ${nameData.fullName}. Телефон: ${phone}. Деталі доставки заповнює оператор.`,

    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function buildMinimalPayload(data) {
  const fullNameInput = data.get('fullName').trim();
  const phoneInput = data.get('phone').trim();

  const phone = formatPhone(phoneInput);
  const nameData = splitFullName(fullNameInput);

  return {
    name: nameData.fullName,
    phone: phone,
    product_name: PRODUCT.name,
    product_price: PRODUCT.price,
    quantity: 1,
    total: PRODUCT.price,
    status: 'new',
    source: PRODUCT.source,
    client_note: `Заявка з лендингу нічника. ПІБ клієнта: ${nameData.fullName}. Телефон: ${phone}. Деталі доставки заповнює оператор.`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

async function insertOrder(orderPayload, safePayload, minimalPayload) {
  const supabaseClient = getSupabaseClient();

  const firstAttempt = await supabaseClient
    .from('orders')
    .insert([orderPayload])
    .select()
    .single();

  if (!firstAttempt.error) {
    return firstAttempt.data;
  }

  console.warn('Повний payload не прийнятий Supabase:', firstAttempt.error.message);

  const secondAttempt = await supabaseClient
    .from('orders')
    .insert([safePayload])
    .select()
    .single();

  if (!secondAttempt.error) {
    return secondAttempt.data;
  }

  console.warn('Safe payload не прийнятий Supabase:', secondAttempt.error.message);

  const thirdAttempt = await supabaseClient
    .from('orders')
    .insert([minimalPayload])
    .select()
    .single();

  if (!thirdAttempt.error) {
    return thirdAttempt.data;
  }

  console.error('Minimal payload теж не прийнятий Supabase:', thirdAttempt.error.message);
  throw thirdAttempt.error;
}

function saveLeadToLocalStorage(orderPayload) {
  const key = 'kids_room_landing_orders';

  try {
    const current = JSON.parse(localStorage.getItem(key) || '[]');

    current.unshift({
      ...orderPayload,
      saved_local_at: new Date().toISOString()
    });

    localStorage.setItem(key, JSON.stringify(current.slice(0, 20)));
  } catch (error) {
    console.warn('Не вдалося зберегти заявку локально:', error);
  }
}

function resetButton(button) {
  if (!button) return;

  button.disabled = false;
  button.textContent = 'Замовити за 599 грн';
}

function startSaleTimer() {
  const timerHours = document.getElementById('timerHours');
  const timerMinutes = document.getElementById('timerMinutes');
  const timerSeconds = document.getElementById('timerSeconds');
  const saleTimerSmall = document.getElementById('saleTimerSmall');

  const timerKey = 'kids_room_night_light_sale_timer_end';
  const now = Date.now();

  let endTime = Number(localStorage.getItem(timerKey));

  if (!endTime || endTime < now) {
    endTime = now + 2 * 60 * 60 * 1000;
    localStorage.setItem(timerKey, String(endTime));
  }

  function updateTimer() {
    const currentTime = Date.now();
    let distance = endTime - currentTime;

    if (distance <= 0) {
      endTime = Date.now() + 2 * 60 * 60 * 1000;
      localStorage.setItem(timerKey, String(endTime));
      distance = endTime - Date.now();
    }

    const hours = Math.floor(distance / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    if (timerHours) timerHours.textContent = formattedHours;
    if (timerMinutes) timerMinutes.textContent = formattedMinutes;
    if (timerSeconds) timerSeconds.textContent = formattedSeconds;

    if (saleTimerSmall) {
      saleTimerSmall.textContent = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    }
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

if (form) {
  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    if (isSending) return;

    const data = new FormData(form);

    const fullName = data.get('fullName').trim();
    const phone = data.get('phone').trim();
    const submitButton = form.querySelector('button[type="submit"]');

    if (!fullName || !phone) {
      setStatus('Заповніть, будь ласка, ПІБ та номер телефону.', 'error');
      return;
    }

    if (fullName.length < 3) {
      setStatus('Введіть, будь ласка, коректне ПІБ.', 'error');
      return;
    }

    if (!isValidUkrainianPhone(phone)) {
      setStatus('Введіть коректний номер телефону у форматі +380...', 'error');
      return;
    }

    const orderPayload = buildOrderPayload(data);
    const safePayload = buildSafePayload(data);
    const minimalPayload = buildMinimalPayload(data);

    try {
      isSending = true;

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Відправляємо...';
      }

      setStatus('Відправляємо заявку...', '');

      saveLeadToLocalStorage(orderPayload);

      await insertOrder(orderPayload, safePayload, minimalPayload);

      setStatus('Дякуємо! Заявку прийнято. Менеджер скоро зв’яжеться з вами.', 'success');

      form.reset();

      if (submitButton) {
        submitButton.textContent = 'Заявку прийнято';
      }

      setTimeout(() => {
        resetButton(submitButton);
        isSending = false;
      }, 2500);

    } catch (error) {
      console.error(error);

      setStatus(
        'Не вдалося відправити заявку в CRM. Перевір таблицю orders або політики доступу Supabase.',
        'error'
      );

      resetButton(submitButton);
      isSending = false;
    }
  });
}

startSaleTimer();