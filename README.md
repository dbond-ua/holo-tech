# HoloTech — лендинг-магазин оборудования для автономного питания

Продающий лендинг на Next.js 14 (App Router) + TypeScript + Tailwind CSS, с двумя
языками (🇺🇦 українська — основной, 🇬🇧 English), лид-формой оформления заказа вместо
классического чекаута, кодо-независимой админкой `/admin`, **самостоятельно размещённой
PostgreSQL на вашем VPS** (без Supabase и без self-hosted Supabase), Telegram-ботом для
менеджеров и Новой Поштой для выбора отделения.

Ассортимент: зарядные станции, инверторы, LiFePO4 аккумуляторы, солнечные панели,
готовые комплекты «инвертор + аккумулятор» и аксессуары. Это не ERP и не большой
интернет-магазин — задача проекта: красиво продать, собрать заявку и удобно довести
её до звонка менеджера.

## Архитектура

```
Frontend (Next.js, /uk /en)
   │
   ▼
Backend API (тот же Next.js-процесс: Route Handlers + Server Actions)
   │
   ├──▶ PostgreSQL — на этом же VPS, слушает только localhost/private network
   │      └─ включая локальный справочник Nova Poshta (nova_cities/nova_warehouses),
   │         которий раз в сутки обновляет отдельный importer — см. «Настройка Nova Poshta»
   ├──▶ Telegram Bot API — уведомления о заказах, управление статусами
   └──▶ локальная файловая система — фото товаров (storage/products, отдаются
        через собственный /api/storage/products/[filename], не напрямую)

Nova Poshta API вызывается только ежедневным/ручным importer'ом (никогда из
Route Handler'ов, обслуживающих запросы браузера) и без API-ключа — см. ниже.
```

Ключевые правила этой архитектуры (соблюдаются во всём коде):

1. PostgreSQL — отдельный сервис от frontend/backend (отдельный процесс `postgres`,
   отдельный systemd-юнит).
2. PostgreSQL **не** доступен напрямую из интернета.
3. PostgreSQL слушает только `localhost` (или приватную сеть, если backend на другой
   машине) — см. `listen_addresses` в ШАГ 1 ниже.
4. К базе имеет доступ **только backend**, через один выделенный low-privilege
   Postgres-юзер (`holotech_app`, создаётся в `scripts/create-db-role.sql`) — не «anon»
   и не «service-role» ролей, потому что браузер никогда не подключается к базе
   напрямую.
5. Все пароли и секреты — только через переменные окружения (`.env`, см.
   `.env.example`), нигде не захардкожены.
6. `.env`, `storage/` (реальные фото) и бэкапы **никогда** не попадают в git — см.
   `.gitignore`.
7. Supabase (в т.ч. self-hosted) в проекте не используется — ни как зависимость, ни
   как сервис.
8. Прямого подключения frontend → PostgreSQL нет и не может быть: браузер видит только
   HTTP-роуты Next.js.

Почему не Supabase/MariaDB/SQLite для этого проекта — см. историю решения в git-логе
(коммит с анализом архитектуры) и комментарии в `migrations/0001_init.sql` — коротко:
проект использует `jsonb`, `text[]`, enum-типы и `plpgsql`-функции (`adjust_stock`,
`next_order_number`) как основные примитивы и обслуживает несколько одновременных
писателей (checkout, admin, Telegram webhook, cron) — это ровно то, для чего
PostgreSQL подходит лучше всего, а MariaDB/SQLite потребовали бы либо отказа от этих
возможностей, либо архитектуры с одним писателем.

## Стек

- Next.js 14 (App Router, React Server Components, Server Actions)
- TypeScript (strict)
- Tailwind CSS 3 (кастомная дизайн-система, светлая/тёмная тема)
- i18n: `uk` (по умолчанию) / `en`, без русского — `/uk/...` и `/en/...`
- **PostgreSQL** (self-hosted, через [`postgres`](https://github.com/porsager/postgres) —
  каталог, заказы, админка; со встроенным demo-режимом, когда `DATABASE_URL` не задан)
- Локальная файловая система — фото товаров (без облачного Storage)
- Telegram Bot API — уведомления о заказах и управление статусами
- Nova Poshta — подбор города/відділення при оформлении из локального справочника в
  PostgreSQL (с demo-даними как fallback), без API-ключа — см. «Настройка Nova Poshta»
- lucide-react — иконки, next-themes — тема
- Корзина/избранное — React Context + localStorage

## Быстрый старт (локально, без реальной БД)

```bash
npm install
npm run dev
```

Откройте http://localhost:3000 — редиректит на `/uk`.

Проект **полностью рабочий без единой переменной окружения**: без `DATABASE_URL`
каталог берётся из `src/lib/data.ts`, авторизация в админке — через демо-аккаунт,
Telegram-интеграция просто не выполняет реальных вызовов, а чекаут показывает
demo-города/відділення (Nova Poshta вообще не требует `NOVA_POSHTA_API_KEY` — её
справочник живёт в самой PostgreSQL и заполняется отдельным importer'ом, см.
«Настройка Nova Poshta»). По мере добавления переменных из `.env.example` эти части
включаются сами, без правок кода.

Для продакшн-сборки:

```bash
npm run build
npm start
```

## ⚠️ Важное примечание о сборке и проверке

Этот проект дорабатывался в изолированной облачной песочнице без доступа к реестру
npm (`npm install postgres` возвращал 403 от прокси), поэтому здесь не удалось
выполнить реальный `npm install` / `next build` / `next lint` с фактическим пакетом
`postgres` в `node_modules`. Весь код написан и вычитан вручную:

- Типы и кросс-файловые ошибки проверялись прогоном `tsc` через самописный
  `tsconfig.check.json` и набор ambient-деклараций для отсутствующих `@types/*`,
  включая написанный вручную минимальный shim для модуля `postgres`.
- Сама SQL-схема, миграции и хранимые функции (`adjust_stock`, `next_order_number`)
  проверялись напрямую через `psql` против реального локального PostgreSQL 16,
  доступного в этой песочнице — то есть SQL реально выполнялся, только не через сам
  npm-пакет `postgres`.

Перед деплоем в продакшн на своей машине/VPS обязательно выполните:

```bash
npm install
npm run lint
npm run build
```

и поправьте мелкие несостыковки версий пакетов, если npm подтянет более новую
патч-версию `postgres` с отличающимися типами.

## Переменные окружения

Скопируйте `.env.example` в `.env` (не `.env.local` — так удобнее для systemd/VPS,
и `.env` уже в `.gitignore`) и заполните то, что уже готово — остальное можно оставить
пустым, интеграции просто останутся в demo-режиме.

| Переменная | Где взять | Публична? |
|---|---|---|
| `DATABASE_URL` | см. ШАГ 3-5 ниже | **нет, только сервер** |
| `PRODUCT_IMAGES_DIR` | путь на диске VPS, по умолчанию `./storage/products` | нет |
| `ADMIN_SESSION_SECRET` | `openssl rand -hex 32` | нет |
| `ADMIN_BOOTSTRAP_SECRET` | `openssl rand -hex 24`, только на время создания первого админа | **нет** |
| `TELEGRAM_BOT_TOKEN` | @BotFather | **нет** |
| `TELEGRAM_CHAT_ID` | см. ниже | нет |
| `TELEGRAM_WEBHOOK_SECRET` | `openssl rand -hex 24` | нет |
| `CRON_SECRET` | `openssl rand -hex 24` — защищает и `/api/cron/reminders`, и `/api/cron/nova-poshta-sync` | нет |
| `NOVA_POSHTA_API_KEY` | не используется для справочника городов/відділень (см. «Настройка Nova Poshta»); зарезервировано на будущее для методов с авторизацией (розрахунок вартості, ТТН) | **нет, только сервер** |
| `NEXT_PUBLIC_SITE_URL` | ваш домен | да |

Секретные значения (`DATABASE_URL`, Telegram bot token, Nova Poshta API key и т.д.)
нигде не используются в клиентском коде и не попадают в бандл браузера — только в
файлах `"use server"` / `import "server-only"` / route handlers. Ни один из них не
просится и не отправляется в чат — заполняйте `.env` сами, на своей машине/VPS.

---

## Розгортання на VPS — покроково

Ниже — самостоятельная инструкция для чистого VPS (Ubuntu/Debian). Выполняйте по
порядку; каждый шаг не требует присылать мне пароли/токены/ключи — вы вводите их
только у себя, в `.env` или интерактивно в `psql`.

### ШАГ 1 — что установить

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib nodejs npm git
```

(если нужна конкретная версия Node — поставьте через [nvm](https://github.com/nvm-sh/nvm)
или NodeSource; проект требует Node 18+).

Проверьте, что PostgreSQL слушает только localhost — откройте
`/etc/postgresql/*/main/postgresql.conf` и убедитесь, что:

```
listen_addresses = 'localhost'
```

(это значение по умолчанию в большинстве дистрибутивов — просто проверьте, что оно не
изменено на `'*'`). Проверьте также `/etc/postgresql/*/main/pg_hba.conf` — соединения
должны разрешаться только `local`/`127.0.0.1`/`::1`, без внешних адресов. Если меняли
что-то в этих файлах — перезапустите: `sudo systemctl restart postgresql`.

Дополнительно закройте порт 5432 файрволом от внешнего мира (даже если Postgres и так
слушает только localhost — второй рубеж защиты не помешает):

```bash
sudo ufw deny 5432/tcp
```

### ШАГ 2 — какие команды выполнить (клонирование и зависимости)

```bash
git clone <ваш-репозиторий> holotech
cd holotech
npm install
cp .env.example .env
```

### ШАГ 3 — как создать базу данных PostgreSQL

```bash
sudo -u postgres psql -c "create database holotech;"
```

(это же делает и `scripts/create-db-role.sql` из следующего шага — можно выполнить
только его и пропустить эту команду отдельно).

### ШАГ 4 — как создать пользователя БД

Откройте `scripts/create-db-role.sql`, замените `CHANGE_ME_STRONG_PASSWORD` на
реальный случайный пароль (например, из `openssl rand -base64 32`), затем выполните:

```bash
sudo -u postgres psql -f scripts/create-db-role.sql
```

Это создаёт роль `holotech_app` с `LOGIN`, без `SUPERUSER`/`CREATEDB`/`CREATEROLE`, и
даёт ей право подключаться только к базе `holotech`. Права на таблицы этот скрипт не
выдаёт — их выдаёт отдельная миграция (`migrations/0008_db_roles_and_grants.sql`), уже
после того как таблицы созданы (см. ШАГ 6).

После выполнения — **сотрите пароль из файла на диске** (`git checkout scripts/create-db-role.sql`
если правили прямо в git-чекауте, или просто верните плейсхолдер обратно), чтобы
реальный пароль не осел в истории файлов на сервере дольше, чем нужно.

### ШАГ 5 — какие значения указать в `.env`

Откройте `.env` и заполните как минимум:

```bash
DATABASE_URL=postgresql://holotech_app:<пароль из ШАГ 4>@127.0.0.1:5432/holotech
PRODUCT_IMAGES_DIR=/var/lib/holotech/storage/products
ADMIN_SESSION_SECRET=<результат openssl rand -hex 32>
NEXT_PUBLIC_SITE_URL=https://<ваш-домен>
```

Остальные переменные (`TELEGRAM_*`, `NOVA_POSHTA_API_KEY`, `CRON_SECRET`) — по мере
подключения соответствующих интеграций, см. разделы ниже. Создайте директорию для фото
товаров и выдайте права процессу, под которым будет работать Node:

```bash
sudo mkdir -p /var/lib/holotech/storage/products
sudo chown -R <ваш-linux-пользователь> /var/lib/holotech/storage
```

### ШАГ 6 — как выполнить миграции

```bash
for f in migrations/*.sql; do
  echo "== $f =="
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done
```

Применяются по порядку имён файлов: `0001_init.sql` (таблицы, enum'ы, функции
`adjust_stock`/`next_order_number`) → `0002`…`0007` (роли менеджеров, память о доставке
клиента, нумерация заказов, доп. характеристики товара, демо-данные, язык заказа) →
`0008_db_roles_and_grants.sql` (выдаёт `holotech_app` права на все таблицы/функции —
именно тут роль из ШАГ 4 получает реальный доступ) → `0009_extra_indexes.sql`.
`0006_demo_seed.sql` добавляет 6 категорий, 11 брендов и 5 демо-товаров — их можно
отредактировать или удалить прямо в `/admin/products`, как обычные товары. Все файлы
идемпотентны (`if not exists` / `on conflict do nothing`) — повторный прогон безопасен.

Либо одним файлом (тот же результат, склеенный для удобства):

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/ALL_MIGRATIONS_COMBINED.sql
```

### ШАГ 7 — как создать первого администратора

Временно задайте в `.env` `ADMIN_BOOTSTRAP_SECRET` (`openssl rand -hex 24`), запустите
приложение (см. ниже) или перезапустите его, если уже запущено, затем выполните у себя
в терминале (никому не отправляя этот запрос — пароль остаётся только у вас):

```bash
npm run build && npm start &
curl -X POST http://127.0.0.1:3000/api/admin/bootstrap \
  -H "Content-Type: application/json" \
  -d '{"secret":"<ADMIN_BOOTSTRAP_SECRET>","name":"Имя","email":"you@example.com","password":"ваш-пароль"}'
```

Эндпоинт откажет, если уже есть хотя бы один менеджер, и полностью отключён (503),
пока `ADMIN_BOOTSTRAP_SECRET` не задан. После успешного создания администратора
уберите или смените эту переменную и перезапустите процесс, чтобы запрос нельзя было
повторить. Альтернатива — `node scripts/hash-password.mjs` + ручной `insert into
managers (...)` через `psql`, если так удобнее.

Дальше запускайте приложение постоянно через systemd/pm2 (пример systemd-юнита не
входит в этот README — используйте свой обычный процесс деплоя Next.js-приложений;
единственное специфичное для этого проекта требование — переменные из `.env` должны
быть доступны процессу).

### ШАГ 8 — как сделать бэкап

```bash
./scripts/backup.sh
```

Пишет сжатый дамп (`pg_dump -Fc`) в `backups/holotech_<дата>_<время>.dump` и
автоматически удаляет всё старше последних 14 копий (настраивается переменной
`KEEP_LAST`). Добавьте в cron для регулярных копий, например каждую ночь:

```
0 3 * * * cd /path/to/holotech && ./scripts/backup.sh >> /var/log/holotech-backup.log 2>&1
```

Восстановление — `./scripts/restore.sh backups/holotech_<файл>.dump` (спросит
подтверждение, показывает только хост/имя базы, не пароль).

### ШАГ 9 — как проверить, что всё работает

1. `curl -I http://127.0.0.1:3000/uk` → `200 OK`.
2. `psql "$DATABASE_URL" -c "select count(*) from products;"` → видно демо-товары (5).
3. Зайдите в `/admin/login`, войдите созданным в ШАГ 7 админом.
4. `/admin/products` → откройте любой демо-товар, измените цену, сохраните → убедитесь,
   что цена изменилась и на публичной странице товара.
5. Оформите тестовый заказ через витрину (`/uk/checkout`) → убедитесь, что заказ
   появился в `/admin/orders` и (если настроен Telegram) пришло сообщение в чат.
6. В `/admin/orders/<id>` смените статус → убедитесь, что он изменился и в БД
   (`select status from orders where id = '<id>';`), и в отредактированном сообщении
   Telegram.
7. Для товара со включённым учётом остатка (`stock_count` не пусто) оформите заказ и
   проверьте `select stock_count, stock_reserved from products where id = '<id>';` —
   `stock_reserved` должен вырасти сразу после оформления, а `stock_count` — только
   после подтверждения заказа менеджером.

Если что-то из этого не работает — проверьте `journalctl`/логи процесса Node на предмет
сообщений `[catalog]`, `[orders]`, `[admin/*]` — они пишут причину ошибки (без утечки
самого текста SQL или значений секретов) через `describeDbError()`
(`src/lib/db/errors.ts`).

---

## Настройка Telegram-бота

1. Создайте бота через [@BotFather](https://t.me/BotFather), получите `TELEGRAM_BOT_TOKEN`.
2. Добавьте бота в чат/группу менеджеров, отправьте туда любое сообщение, затем откройте
   `https://api.telegram.org/bot<TOKEN>/getUpdates` и возьмите `chat.id` — это
   `TELEGRAM_CHAT_ID`.
3. Сгенерируйте `TELEGRAM_WEBHOOK_SECRET` (`openssl rand -hex 24`) и после деплоя
   зарегистрируйте webhook:
   ```
   https://api.telegram.org/bot<TOKEN>/setWebhook?url=<SITE_URL>/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
   ```

После этого каждый новый заказ приходит в чат карточкой с кнопками «Подзвонив» /
«Зв'язався» / «Передзвонити пізніше» / «Підтвердити» / «Скасувати». Нажатие кнопки
меняет статус заказа, пишет запись в историю (кто и когда) и редактирует то же самое
сообщение в Telegram, а не шлёт новое. «Передзвонити пізніше» открывает мини-меню
выбора времени (30/60/120/240 мин) и уже потом переводит заказ в статус «Відкладено».
Telegram никогда не подключается к базе напрямую — только через backend
(`src/app/api/telegram/webhook/route.ts` → `updateOrderStatus()` → PostgreSQL).

## Напоминания о необработанных заказах

`GET /api/cron/reminders?secret=<CRON_SECRET>` — вызывайте по расписанию (например,
раз в 5 минут) через системный cron:

```
*/5 * * * * curl -fsS "http://127.0.0.1:3000/api/cron/reminders?secret=<CRON_SECRET>" >/dev/null
```

Первое напоминание уходит через ~15 минут после создания заказа, если статус так и
остался «Нове», затем — реже (по умолчанию 15/60/240 минут, настраивается в таблице
`settings`, ключ `reminder_intervals_minutes`). Любое изменение статуса (включая
ручное или через Telegram) сразу останавливает напоминания по этому заказу — менеджеров
не спамит.

## Настройка Nova Poshta (локальный справочник, без API-ключа)

Города, отделения и поштоматы Нової Пошти хранятся локально, в нашей же PostgreSQL
(`nova_cities`, `nova_warehouses`, `nova_warehouse_types` — миграция
`migrations/0010_nova_poshta_directory.sql`). Чекаут никогда не ходит в Nova Poshta
напрямую — он читает эти таблицы через `/api/nova-poshta/cities` и
`/api/nova-poshta/warehouses`. Актуальность справочника поддерживает отдельный
importer (`src/lib/novaposhta-import.ts`), который раз в сутки (или вручную)
перезаписывает эти таблицы, обращаясь к Nova Poshta напрямую.

Архитектура: `Nova Poshta API → ежедневный importer → PostgreSQL (nova_cities /
nova_warehouses) → backend API HoloTech (/api/nova-poshta/*) → форма чекаута`.

**`NOVA_POSHTA_API_KEY` для этого функционала не используется и не нужен** —
`Address.getCities`, `Address.getWarehouses` и `Address.getWarehouseTypes`
официально не требуют ключа («Доступність: Не потребує використання API-ключа»).
Тип відділення/поштомату определяется динамически через `Address.getWarehouseTypes`
на каждом синке — жёстко закодированного GUID для «Поштомат» нигде нет (в открытых
источниках он не совпадает между поставщиками, так что доверять захардкоженному
значению нельзя).

Пока подключены только эти три read-only метода. Расчёт стоимости доставки,
создание ТТН и другие методы, требующие авторизации (а значит и
`NOVA_POSHTA_API_KEY`), сюда не входят — это отдельная задача на будущее, если
понадобится.

### Первый запуск (после разворачивания на VPS)

Пока таблицы `nova_cities`/`nova_warehouses` пустые, чекаут показывает demo-список
из 5 крупных городов — форма полностью рабочая и без импорта. Чтобы подставить
реальный справочник, вызовите тот же endpoint, что и ежедневный cron:

```
curl -fsS "http://127.0.0.1:3000/api/cron/nova-poshta-sync?secret=<CRON_SECRET>"
```

Ответ — JSON со сводкой (`citiesUpserted`, `warehousesUpserted` и т.д.). Полный
прогон по всій Україні — это несколько тысяч paginated-запросов к Nova Poshta с
паузой ~350мс между ними, так что первый импорт может занять несколько минут.

### Ежедневное обновление

```
17 3 * * * curl -fsS "http://127.0.0.1:3000/api/cron/nova-poshta-sync?secret=<CRON_SECRET>" >/dev/null
```

Каждый прогон заново тянет полный список отделений/поштоматів; всё, что Nova Poshta
больше не возвращает (закрытое отделение и т.п.), помечается `is_active = false`, а
не удаляется — старые заказы, ссылающиеся на такой `ref`, не ломаются.

### Ручной запуск

Тот же самый `GET /api/cron/nova-poshta-sync?secret=<CRON_SECRET>` — просто
вызовите его руками (curl, браузер с query-параметром, Postman) в любой момент,
когда нужно обновить справочник немедленно.

## Структура проекта

```
src/
  app/
    (shop)/[locale]/        — витрина, локализованные маршруты /uk и /en
      stations/, inverters/, batteries/, solar-panels/, kits/, accessories/
                             — каталог по категориям + /[slug] карточка товара
      compare/, quiz/        — сравнение и квиз подбора
      cart/, checkout/       — корзина и лид-форма оформления заказа
      order/[orderNumber]/   — страница «заявку принято»
      favorites/, profile/   — демо-разделы
      layout.tsx             — локализованный root layout, SEO (hreflang/canonical/OG)
    (admin)/admin/           — код-независимая админка (отдельный root layout)
      login/                 — форма входа
      (protected)/           — layout с проверкой сессии + сайдбар
        products/, categories/, brands/, orders/
      actions.ts             — все Server Actions админки (CRUD, логин, смена статуса)
    api/
      orders/                — POST создать заказ, GET по номеру
      admin/upload/           — загрузка/удаление фото товара на локальный диск VPS
      admin/bootstrap/        — одноразовое создание первого администратора (см. ШАГ 7)
      storage/products/[filename]/ — отдаёт фото товара с диска (безопасный URL, не сам путь)
      telegram/webhook/       — обработка нажатий инлайн-кнопок бота
      cron/reminders/         — рассылка напоминаний по неразобранным заказам
      cron/nova-poshta-sync/   — ежедневный/ручной синк справочника Nova Poshta (см. выше)
      nova-poshta/             — city/warehouse из локальной БД (никогда не ходит в Nova Poshta напрямую)
    sitemap.ts, robots.ts     — SEO с учётом обеих локалей
  i18n/                       — словари uk/en, I18nProvider, getDictionary
  components/                 — Header/Footer/MobileNav, карточки товаров, UI-примитивы
  context/CartContext.tsx     — корзина/избранное (localStorage)
  lib/
    data.ts                   — demo-каталог (фолбэк, когда БД пуста/не настроена)
    catalog.ts                — единая точка чтения каталога (PostgreSQL → фолбэк на data.ts)
    orders.ts, telegram.ts, novaposhta.ts, novaposhta-import.ts, admin-auth.ts, utm.ts, env.ts
    admin/                     — серверные функции для CRUD в админке (raw SQL)
    db/                        — client.ts (пул подключений + транзакции), types.ts (типы
                                 строк таблиц), errors.ts (маппинг ошибок Postgres)
    storage/local.ts           — сохранение/удаление фото товара на локальном диске
migrations/                   — воспроизводимые SQL-миграции, применять по порядку (ШАГ 6)
  0001_init.sql                — таблицы, enum'ы, функции adjust_stock/next_order_number
  0002_admin_roles.sql          — managers.role ('admin' | 'manager')
  0003_customer_delivery_prefs.sql — customers: city_ref/warehouse/warehouse_ref/language
  0004_order_numbering.sql      — next_order_number(): TB-YYYYMMDD-NNN, атомарно
  0005_extra_specs_array.sql    — products.extra_specs: доп. характеристики (масив, укр/eng)
  0006_demo_seed.sql            — 6 категорий, 11 брендов, 5 демо-товаров в БД
  0007_order_language.sql       — orders.language (мова, з якою оформлено замовлення)
  0008_db_roles_and_grants.sql  — выдаёт роли holotech_app права на таблицы/функции
  0009_extra_indexes.sql        — індекси на orders.customer_id, order_items.product_id/kit_id
  0010_nova_poshta_directory.sql — nova_cities/nova_warehouses/nova_warehouse_types — локальный
                                   справочник Nova Poshta (см. «Настройка Nova Poshta»)
  ALL_MIGRATIONS_COMBINED.sql  — все миграции подряд одним файлом, для разового прогона
scripts/
  create-db-role.sql            — создаёт БД holotech и роль holotech_app (ШАГ 3-4)
  backup.sh, restore.sh         — бэкап/восстановление (ШАГ 8)
  hash-password.mjs             — генерация пароля для первого менеджера (альтернатива ШАГ 7)
```

## Как это работает вместе

1. Пользователь заходит по рекламной ссылке с UTM-метками → метки сохраняются в
   `sessionStorage` при первом заходе (`src/lib/utm.ts`), переживают переходы по сайту.
2. Собирает корзину, идёт в `/checkout` → простая лид-форма (имя, телефон, способ
   доставки — відділення/поштомат Нової Пошти или курьер, комментарий), без создания
   аккаунта и лишних шагов.
3. `POST /api/orders` заново валидирует всё на сервере (никогда не доверяя тому, что
   прислал клиент), создаёт заказ, товарные позиции и резервирует остаток — всё внутри
   одной PostgreSQL-транзакции (`src/lib/orders.ts` → `withTransaction`), сохраняет UTM
   и путь посадочной страницы, отправляет карточку заказа в Telegram.
4. Менеджер обрабатывает заказ прямо из Telegram (кнопки статуса) или из `/admin/orders`
   — оба пути ведут в одну функцию `updateOrderStatus`, которая (тоже в одной
   транзакции) пишет историю статусов, конвертирует резерв остатка в реальное списание
   или возвращает его обратно, правит сообщение в Telegram и (для «нове») планирует
   следующее напоминание.
5. Если заказ долго никто не трогает — приходит напоминание в тот же чат; как только
   статус меняется, напоминания прекращаются.

## Демо-режим и продакшн — без переключателей в коде

Каждая интеграция проверяет, заполнены ли её переменные окружения
(`IS_DB_CONFIGURED`, `IS_TELEGRAM_CONFIGURED` в `src/lib/env.ts`), и при их
отсутствии прозрачно работает на demo-данных вместо того, чтобы падать. Это значит,
что проект можно смотреть и показывать сразу после распаковки, а затем подключать
реальные сервисы по одному, в любом порядке, не трогая код. Nova Poshta — частный
случай: её demo-режим зависит от `IS_DB_CONFIGURED` и от того, успел ли уже
отработать importer (см. «Настройка Nova Poshta»), а не от отдельной переменной —
`NOVA_POSHTA_API_KEY`/`IS_NOVA_POSHTA_CONFIGURED` остались в `env.ts`, но этот
конкретный функционал их не читает.
