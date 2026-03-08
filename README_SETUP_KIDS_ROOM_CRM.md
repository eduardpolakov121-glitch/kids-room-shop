# Kids Room — повна інструкція по запуску сайту, адмінки і CRM

## Що входить у комплект
- `index.html` — головна сторінка магазину
- `product.html` — картка товару
- `products.js` — товари магазину
- `script.js` — логіка каталогу
- `style.css` — стилі магазину
- `cart.js` — кошик і оформлення замовлення
- `crm.js` — відправка замовлень у Supabase REST
- `admin-safe.html` — адмінка товарів із запам'ятовуванням входу
- `crm-panel.html` — повна CRM з авторизацією через Supabase Auth
- `banner.jpg` — банер
- `logo.jpg` — логотип

---

## КРОК 1. Підготувати Supabase

### 1.1. Відкрити проєкт Supabase
1. Зайди у свій проєкт Supabase.
2. Відкрий `SQL Editor`.
3. Встав і виконай цей SQL повністю.

```sql
create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  moved_at timestamptz,
  customer_first_name text,
  customer_last_name text,
  name text,
  phone text,
  city text,
  delivery text,
  address text,
  items jsonb not null default '[]'::jsonb,
  total numeric(12,2) not null default 0,
  status text not null default 'Новий',
  status_group text not null default 'new',
  day_bucket integer not null default 0,
  operator_comment text not null default '',
  manager_comment text not null default '',
  source text not null default 'website'
);

alter table public.orders
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists moved_at timestamptz,
  add column if not exists customer_first_name text,
  add column if not exists customer_last_name text,
  add column if not exists status_group text not null default 'new',
  add column if not exists day_bucket integer not null default 0,
  add column if not exists operator_comment text not null default '',
  add column if not exists manager_comment text not null default '',
  add column if not exists source text not null default 'website';

create table if not exists public.crm_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text not null default '',
  role text not null check (role in ('admin', 'operator')),
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;
alter table public.crm_profiles enable row level security;

-- удалить старые политики, если они уже были

drop policy if exists "anon_insert_orders" on public.orders;
drop policy if exists "auth_select_orders" on public.orders;
drop policy if exists "auth_update_orders" on public.orders;
drop policy if exists "auth_delete_orders" on public.orders;
drop policy if exists "profiles_self_select" on public.crm_profiles;

create policy "anon_insert_orders"
on public.orders
for insert
to anon, authenticated
with check (true);

create policy "auth_select_orders"
on public.orders
for select
to authenticated
using (true);

create policy "auth_update_orders"
on public.orders
for update
to authenticated
using (true)
with check (true);

create policy "auth_delete_orders"
on public.orders
for delete
to authenticated
using (true);

create policy "profiles_self_select"
on public.crm_profiles
for select
to authenticated
using (auth.uid() = id);
```

### 1.2. Создать сотрудников CRM
1. В Supabase открой `Authentication` → `Users`.
2. Нажми `Add user`.
3. Создай первого пользователя:
   - email: твой email
   - password: свой пароль
4. После создания скопируй `UUID` пользователя.
5. Открой `Table Editor` → `crm_profiles`.
6. Добавь запись вручную:
   - `id` = UUID пользователя из Auth
   - `email` = тот же email
   - `full_name` = имя сотрудника
   - `role` = `admin`

Для оператора делается точно так же, только роль `operator`.

### 1.3. Проверить Project URL и publishable key
1. Открой `Project Settings` → `API`.
2. Убедись, что:
   - `Project URL` совпадает с тем, что уже стоит в `crm.js` и `crm-panel.html`
   - `publishable key` тоже совпадает

Если у тебя другой ключ, замени его в двух файлах:
- `crm.js`
- `crm-panel.html`

---

## КРОК 2. Подготовить файлы сайта

У тебя должны быть в одной папке такие файлы:
- `index.html`
- `product.html`
- `products.js`
- `script.js`
- `style.css`
- `cart.js`
- `crm.js`
- `admin-safe.html`
- `crm-panel.html`
- `banner.jpg`
- `logo.jpg`

Важно: `banner.jpg` и `logo.jpg` должны лежать в той же папке, что и html файлы.

---

## КРОК 3. Залить в GitHub

### 3.1. Если репозиторий уже есть
1. Открой свой репозиторий GitHub.
2. Нажми `Add file` → `Upload files`.
3. Перетащи все новые файлы.
4. Нажми `Commit changes`.

### 3.2. Если репозитория еще нет
1. Нажми `New repository`.
2. Назови, например: `kids-room`.
3. Создай репозиторий.
4. Загрузи все файлы.
5. Нажми `Commit changes`.

---

## КРОК 4. Подключить к Vercel

### 4.1. Если проект уже был подключен
1. Зайди в Vercel.
2. Открой свой проект.
3. Нажми `Redeploy`, если обновление не подтянулось автоматически.

### 4.2. Если проект еще не подключен
1. В Vercel нажми `Add New` → `Project`.
2. Подключи GitHub.
3. Выбери репозиторий `kids-room`.
4. Нажми `Deploy`.

### 4.3. Важное
Это обычный статический сайт, поэтому:
- `Framework Preset` можно оставить `Other`
- дополнительных build команд не нужно
- output directory не нужна

---

## КРОК 5. Проверить ссылки

После деплоя у тебя должны открываться:
- `https://твой-домен.vercel.app/` — магазин
- `https://твой-домен.vercel.app/admin-safe.html` — админка товаров
- `https://твой-домен.vercel.app/crm-panel.html` — полная CRM

---

## КРОК 6. Как пользоваться

### Магазин
1. Открываешь сайт.
2. Клиент кладет товар в корзину.
3. Заполняет форму.
4. Заказ уходит в Supabase.

### Админка товаров
1. Открываешь `admin-safe.html`.
2. Логин: `admin`
3. Пароль: `5265`
4. Добавляешь или редактируешь товар.
5. Товар сохраняется в `localStorage` браузера и сразу показывается на сайте на этом же устройстве и в этом же браузере.

Важно: текущая админка товара работает через `localStorage`.
Это значит:
- если ты добавил товар в одном браузере, а открыл сайт в другом — товар там не появится
- чтобы товары были общими для всех устройств, следующий этап — вынести каталог товаров тоже в Supabase

### Полная CRM
1. Открываешь `crm-panel.html`.
2. Входишь через email и пароль из Supabase Auth.
3. Видишь разделы:
   - Нові
   - День 1
   - День 2
   - День 3
   - Відправлено
   - Завершено
   - Скасовано
4. Оператор открывает заказ и пишет комментарий.
5. Админ перемещает заказ по этапам.

---

## КРОК 7. Что уже сделано в коде

### Исправление пункта 1
- товары в админке сохраняются корректно
- вход в админку запоминается
- есть кнопка `Вийти`

### Полная CRM
- вход по авторизации через Supabase Auth
- роли `admin` и `operator`
- карточка заказа
- комментарий оператора
- комментарий администратора
- движение по этапам
- фильтры
- поиск
- сортировка

---

## Важное ограничение текущей версии

Каталог товаров пока хранится в `localStorage`, а не в Supabase.
Это сделано специально, чтобы не ломать уже работающий магазин.

Если захочешь следующий этап, тогда можно сделать еще мощнее:
1. товары хранить в Supabase
2. изображения товаров грузить в Supabase Storage
3. общую базу товаров для всех устройств
4. отдельную страницу сотрудников
5. статистику по выкупу и отказам

