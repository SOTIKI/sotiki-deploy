import type { PartialConfig } from '../config/store.js'

export function generateCompose(cfg: PartialConfig): string {
  const img = cfg.useStubImage ? 'nginx:alpine' : 'sotiki/storage:latest'
  const port = cfg.port ?? 3000
  return `version: '3.9'
services:
  storage:
    image: ${img}
    container_name: sotiki-storage
    restart: unless-stopped
    environment:
      - SOTIKI_DOMAIN=${cfg.domain ?? 'localhost'}
      - POSTGRES_HOST=postgresql
      - MAX_DB_SIZE_GB=${cfg.maxDbSizeGb ?? 10}
    ports: ["127.0.0.1:${port}:3000"]
    depends_on:
      postgresql:
        condition: service_healthy
    networks: [sotiki-net]

  postgresql:
    image: postgres:16-alpine
    container_name: sotiki-postgresql
    restart: unless-stopped
    environment:
      - POSTGRES_DB=sotiki
      - POSTGRES_USER=sotiki
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
    volumes: [pg-data:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sotiki"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks: [sotiki-net]

  nginx:
    image: nginx:alpine
    container_name: sotiki-nginx
    restart: unless-stopped
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on: [storage]
    networks: [sotiki-net]

volumes:
  pg-data:
networks:
  sotiki-net:
    driver: bridge
`
}

export function generateNginxConf(cfg: PartialConfig): string {
  const domain = cfg.domain ?? 'localhost'
  const port   = cfg.port ?? 3000
  if (!cfg.sslEnabled) return `server {
    listen 80;
    server_name ${domain};
    location / {
        proxy_pass http://storage:${port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
`
  return `server { listen 80; server_name ${domain}; return 301 https://$host$request_uri; }
server {
    listen 443 ssl http2;
    server_name ${domain};
    ssl_certificate     /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    location / {
        proxy_pass http://storage:${port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
`
}