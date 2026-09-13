POWER BANK JS-658 — TREBA Market

1. Готовий статичний лендинг: index.html + styles.css + script.js + assets/.
2. Ціна зараз: 1449 грн, стара ціна: 3999 грн.
3. Залишок у дизайні: 8 шт.
4. Таймер рахує час до 23:59:59 поточного дня.
5. Форма надсилає POST на /api/order.
6. Серверна функція /api/order.js пересилає заявку на URL з env-змінної ORDER_WEBHOOK_URL.
   У Vercel додайте Environment Variable:
   ORDER_WEBHOOK_URL = ваш webhook ApiX-Drive / CRM.
7. Після зміни env зробіть Redeploy.

Payload форми:
{
  "name": "Ім'я",
  "phone": "+380...",
  "product": "Power Bank 100000 mAh JS-658",
  "price": 1449,
  "source": "powerbank-landing"
}
