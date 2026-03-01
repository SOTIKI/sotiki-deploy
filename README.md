# SOTIKI Deploy

> One command to join the network

## Quick Start

```bash
curl -fsSL https://sotiki.sh/install | bash
sotiki-deploy init
sotiki-deploy start
sotiki-deploy ui
```

## Commands

```
sotiki-deploy init               Setup wizard
sotiki-deploy start              Start all services
sotiki-deploy stop               Stop all services
sotiki-deploy restart            Restart all services
sotiki-deploy status             Show service status + metrics
sotiki-deploy logs [-f]          Stream logs
sotiki-deploy ui                 Start Web UI on 127.0.0.1:8080
```

## Build from source

```bash
git clone https://github.com/sotiki/sotiki-deploy
cd sotiki-deploy
npm install
npm run build
sudo npm install -g ./packages/agent
```

## Web UI access (SSH tunnel)

```bash
ssh -L 8080:localhost:8080 user@your-server
# open http://localhost:8080
```

## Config location

- Root:  `/etc/sotiki-deploy/config.db`
- User:  `~/.config/sotiki-deploy/config.db`

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