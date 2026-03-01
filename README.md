# SOTIKI Deploy

> One command to join the SOTIKI network

---

## Быстрый старт на чистом сервере (Ubuntu/Debian)

### 1. Системные зависимости

```bash
apt-get update && apt-get install -y curl git
```

### 2. Node.js 20+

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node --version
```

### 3. Docker

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker --now
docker --version
```

### 4. Клонируем и собираем

```bash
git clone https://github.com/sotiki/sotiki-deploy.git
cd sotiki-deploy
npm install
npm run build
node packages/agent/scripts/add-shebang.mjs
sudo npm install -g ./packages/agent
sotiki-deploy --version
```

### 5. Инициализация и запуск

```bash
docker network create sotiki-net
sotiki-deploy init
sotiki-deploy start
sotiki-deploy status
```

### 6. Веб-интерфейс

```bash
sotiki-deploy ui
```

UI слушает только `127.0.0.1:8080`. Открыть с локальной машины через SSH туннель:

```bash
# На своём ПК (не на сервере)
ssh -L 8080:localhost:8080 root@ip-сервера

# Затем в браузере
http://localhost:8080
```

---

## Проверка nginx

```bash
# Контейнеры запущены?
docker ps

# nginx отвечает локально?
curl -I http://localhost

# nginx отвечает снаружи?
curl -I http://ip-сервера

# Логи nginx
sotiki-deploy logs -s nginx -f

# Порты контейнера
docker inspect sotiki-nginx | grep -A10 Ports
```

Если настроен SSL:

```bash
curl -I https://домен
```

---

## Команды

```
sotiki-deploy init                    Мастер настройки
sotiki-deploy start [-s service]      Запустить сервисы
sotiki-deploy stop  [-s service]      Остановить сервисы
sotiki-deploy restart                 Перезапустить сервисы
sotiki-deploy status                  Статус + метрики
sotiki-deploy logs -f [-s service]    Логи в реальном времени
sotiki-deploy ui [--port 8080]        Запустить веб-интерфейс
```

---

## Обновление

```bash
cd sotiki-deploy
git pull
npm install
npm run build
node packages/agent/scripts/add-shebang.mjs
sudo npm install -g ./packages/agent
sotiki-deploy restart
```

---

## Конфигурация

| Путь | Описание |
|------|----------|
| `/etc/sotiki-deploy/config.db` | SQLite база (root) |
| `~/.config/sotiki-deploy/config.db` | SQLite база (user) |
| `/etc/sotiki-deploy/docker-compose.yml` | Docker Compose |
| `/etc/sotiki-deploy/nginx.conf` | Конфиг nginx |

---

## Устранение проблем

**sotiki-net not found**
```bash
docker network create sotiki-net
```

**Port already allocated / container name conflict**
```bash
docker rm -f sotiki-storage sotiki-postgresql sotiki-nginx 2>/dev/null; true
sotiki-deploy start
```

**Docker Hub rate limit**
```bash
docker login
```

**Полный сброс и переинициализация**
```bash
docker rm -f sotiki-storage sotiki-postgresql sotiki-nginx 2>/dev/null; true
docker network rm sotiki-net 2>/dev/null; true
docker network create sotiki-net
sotiki-deploy init --force
sotiki-deploy start
```

---

## Roadmap

- **v0.9A (Alpha) — текущая разработка**  
  Базовая инфраструктура:  
  - CLI (`init`, `start`, `stop`, `restart`, `status`, `logs`, `ui`)  
  - Web UI (дашборд, просмотр логов, редактирование конфига, авторизация)  
  - Управление Docker-контейнерами через `dockerode`  
  - Хранение конфигурации в SQLite  
  - Сбор базовых метрик (CPU, RAM, сеть, диск) и их отображение  
  - Использование **заглушки** (`nginx:alpine`) для сервиса `storage` (реальные образы будут позже)  
  - Поддержка Linux (автоопределение root/пользовательского режима)  
  - SSH-туннель для доступа к Web UI

- **v0.9B (Beta)**  
  - Интеграция реальных Docker-образов (`sotiki/storage`, `sotiki/rating`, `sotiki/news`) от команды разработки  
  - Полноценное тестирование всех сценариев деплоя  
  - Улучшение UI/UX (адаптивность, темы, уведомления)  
  - Добавление страницы метрик с графиками за период  
  - Подготовка к публикации npm-пакета

- **v1.0 (Stable)**  
  - CLI + Web UI + все три сервиса (storage, rating, news)  
  - Автоматическое обновление контейнеров (rolling restart с проверкой health)  
  - Базовые алерты (уведомления в Telegram/email)  
  - Система автообновления самого агента  
  - Публикация в npm и подготовка `.deb` пакета

- **v1.1**  
  - Расширенные алерты и вебхуки  
  - Резервное копирование и восстановление конфигурации  
  - Поддержка нескольких серверов (федеративный режим)

- **v1.2**  
  - Двухфакторная аутентификация (TOTP)  
  - Готовый `.deb` пакет для простой установки на Debian/Ubuntu  
  - Возможность установки через `apt`

- **v2.0**  
  - Центральный реестр серверов  
  - Федеративный мониторинг (сбор метрик с нескольких инстансов)  
  - Верификация подписей Docker-образов (поддержка Cosign / Notary)