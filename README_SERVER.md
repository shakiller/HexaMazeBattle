# Инструкция по развертыванию WebSocket сервера

## Быстрый старт

### Вариант 1: Render.com (рекомендуется)

1. Зарегистрируйтесь на [Render.com](https://render.com)
2. Создайте новый "Web Service"
3. Подключите ваш репозиторий GitHub
4. Укажите:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment**: Node
5. Render автоматически определит порт из переменной `PORT`
6. После развертывания скопируйте URL (например: `wss://your-app.onrender.com`)
7. Обновите `WS_SERVER_URL` в `script.js`

### Вариант 2: Railway.app

1. Зарегистрируйтесь на [Railway.app](https://railway.app)
2. Создайте новый проект
3. Подключите репозиторий или загрузите файлы
4. Railway автоматически определит Node.js проект
5. После развертывания скопируйте URL
6. Обновите `WS_SERVER_URL` в `script.js`

### Вариант 3: Replit

1. Зарегистрируйтесь на [Replit.com](https://replit.com)
2. Создайте новый Repl (Node.js)
3. Загрузите файлы `server.js` и `package.json`
4. Запустите проект
5. Используйте URL Replit (например: `wss://your-app.repl.co`)
6. Обновите `WS_SERVER_URL` в `script.js`

### Вариант 4: Локальный запуск

```bash
npm install
node server.js
```

Сервер запустится на `ws://localhost:8080`

## Обновление клиента

После развертывания сервера обновите URL в `script.js`:

```javascript
const WS_SERVER_URL = 'wss://your-server-url.com';
```

## Примечания

- Для продакшена используйте HTTPS/WSS (безопасное соединение)
- Бесплатные платформы могут иметь ограничения по времени работы
- Для постоянной работы рассмотрите платные планы или собственный сервер
