(() => {
  const $ = (s) => document.querySelector(s);
  const pad = (n) => String(n).padStart(2, '0');

  function updateTimer() {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const diff = Math.max(0, end - now);
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const hh = pad(h), mm = pad(m), ss = pad(s);
    const hEl = $('#hours'), mEl = $('#minutes'), sEl = $('#seconds'), mini = $('#timerMini');
    if (hEl) hEl.textContent = hh;
    if (mEl) mEl.textContent = mm;
    if (sEl) sEl.textContent = ss;
    if (mini) mini.textContent = `${hh}:${mm}:${ss}`;
  }
  updateTimer();
  setInterval(updateTimer, 1000);

  const phone = $('input[name="phone"]');
  if (phone) {
    phone.addEventListener('input', () => {
      let v = phone.value.replace(/[^\d+]/g, '');
      if (v.startsWith('0')) v = '+38' + v;
      if (v.startsWith('380')) v = '+' + v;
      phone.value = v.slice(0, 13);
      phone.classList.remove('invalid');
    });
  }

  const form = $('#orderForm');
  const msg = $('#formMessage');
  if (!form || !msg) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.className = 'form-message';
    msg.textContent = '';

    const name = form.elements.name.value.trim();
    const phoneValue = form.elements.phone.value.trim();
    const validPhone = /^\+?380\d{9}$/.test(phoneValue.replace(/\s/g, ''));

    if (name.length < 2 || !validPhone) {
      if (name.length < 2) form.elements.name.classList.add('invalid');
      if (!validPhone) form.elements.phone.classList.add('invalid');
      msg.classList.add('error');
      msg.textContent = 'Перевірте ім’я та номер телефону.';
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    const original = button.innerHTML;
    button.disabled = true;
    button.textContent = 'Надсилаємо…';

    const payload = {
      name,
      phone: phoneValue,
      product: form.elements.product.value,
      price: Number(form.elements.price.value),
      source: 'powerbank-landing'
    };

    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'ORDER_FAILED');
      msg.classList.add('success');
      msg.textContent = 'Дякуємо! Заявку прийнято. Менеджер зв’яжеться з вами.';
      form.reset();
    } catch (err) {
      msg.classList.add('error');
      msg.textContent = 'Форма готова, але канал передачі замовлень ще не підключено.';
      console.warn('Order endpoint is not configured:', err);
    } finally {
      button.disabled = false;
      button.innerHTML = original;
    }
  });
})();
