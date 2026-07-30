#!/usr/bin/env bash
#
# Установка сайта + бэкенда INAVTO ASIA на чистый VPS (Ubuntu 22.04 / 24.04, Debian 12).
# Ставит: Node.js 22, nginx, systemd-службу бэкенда, базу и фото в /var/lib/inavto.
# Скрипт можно запускать повторно — он ничего не сломает (настройки сохраняются).
#
# Запуск (от root):  bash /opt/inavto/deploy/install.sh
#
set -euo pipefail

APP=/opt/inavto            # код (git-клон репозитория)
WWW=/var/www/inavto        # статика сайта, которую раздаёт nginx
DATA=/var/lib/inavto       # база SQLite и загруженные фото (переживают обновления)
ENVFILE=/etc/inavto.env    # настройки бэкенда (ключи, токены)
PORT=3000

say()  { echo -e "\n\033[1;31m[INAVTO]\033[0m $*"; }
fail() { echo -e "\n\033[1;31mОШИБКА:\033[0m $*"; exit 1; }

# Веб-консоли при вставке добавляют невидимый мусор (^[[200~ … ^[[201~) —
# вычищаем его из ответов на вопросы, чтобы ключи записались чистыми.
clean() {
  local v="$1"
  v=${v//$'\e[200~'/}; v=${v//$'\e[201~'/}
  printf '%s' "$v" | tr -cd 'A-Za-z0-9._:@-'
}

[ "$(id -u)" = 0 ] || fail "запустите от root:  sudo bash $0"
[ -d "$APP/backend" ] && [ -d "$APP/site" ] || fail "код не найден в $APP.
Сначала клонируйте репозиторий:
  git clone -b claude/new-session-2ptdl6 https://oauth2:GITHUB_TOKEN@github.com/wareon-top/inavto.git $APP"

# ---------- 1. Пакеты ----------
say "Ставлю системные пакеты (nginx, git, rsync)…"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y -qq
apt-get install -y -qq nginx git rsync curl ca-certificates openssl >/dev/null

# ---------- 2. Node.js 22 ----------
NEED_NODE=1
if command -v node >/dev/null 2>&1; then
  MAJOR=$(node -v | sed 's/^v\([0-9]*\).*/\1/')
  [ "$MAJOR" -ge 20 ] && NEED_NODE=0
fi
if [ "$NEED_NODE" = 1 ]; then
  say "Ставлю Node.js 22…"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
  apt-get install -y -qq nodejs >/dev/null
fi
say "Node.js: $(node -v)"

# ---------- 3. Своп (страховка для тарифов с 1 ГБ памяти) ----------
RAM_MB=$(free -m | awk '/^Mem:/{print $2}')
if [ "$RAM_MB" -lt 1500 ] && [ -z "$(swapon --noheadings 2>/dev/null)" ]; then
  say "Памяти ${RAM_MB} МБ — добавляю своп 1 ГБ…"
  fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ---------- 4. Зависимости бэкенда ----------
say "Ставлю зависимости бэкенда…"
cd "$APP/backend"
npm ci --omit=dev --no-audit --no-fund >/dev/null 2>&1 || {
  say "Не хватило готовых сборок — ставлю компилятор и повторяю…"
  apt-get install -y -qq build-essential python3 >/dev/null
  npm ci --omit=dev --no-audit --no-fund >/dev/null
}

# ---------- 5. Настройки (/etc/inavto.env) ----------
if [ -f "$ENVFILE" ]; then
  say "Настройки уже есть ($ENVFILE) — не трогаю."
else
  say "Первичная настройка."
  echo    "Вопрос 1/3. Ключ админ-панели (длинная строка, которую вы вводите на /admin)."
  read -rp "Вставьте ключ (или просто Enter — сгенерирую новый): " ADMIN_TOKEN < /dev/tty || ADMIN_TOKEN=""
  ADMIN_TOKEN=$(clean "$ADMIN_TOKEN")
  [ -n "$ADMIN_TOKEN" ] || ADMIN_TOKEN=$(openssl rand -hex 24)

  echo
  echo    "Вопрос 2/3. Токен Telegram-бота для заявок (из @BotFather)."
  read -rp "Токен бота (Enter — пропустить, добавите позже): " BOT_TOKEN < /dev/tty || BOT_TOKEN=""
  BOT_TOKEN=$(clean "$BOT_TOKEN")

  ADMIN_CHAT_ID=""
  if [ -n "$BOT_TOKEN" ]; then
    echo
    echo    "Вопрос 3/3. Ваш Telegram ID — куда слать заявки (узнать: напишите боту @userinfobot)."
    read -rp "Telegram ID: " ADMIN_CHAT_ID < /dev/tty || ADMIN_CHAT_ID=""
    ADMIN_CHAT_ID=$(printf '%s' "$(clean "$ADMIN_CHAT_ID")" | tr -cd '0-9-')
  fi

  {
    echo "PORT=$PORT"
    echo "DB_PATH=$DATA/inavto.db"
    echo "UPLOAD_DIR=$DATA/uploads"
    echo "ADMIN_TOKEN=$ADMIN_TOKEN"
    [ -n "$BOT_TOKEN" ]     && echo "BOT_TOKEN=$BOT_TOKEN"
    [ -n "$ADMIN_CHAT_ID" ] && echo "ADMIN_CHAT_ID=$ADMIN_CHAT_ID"
  } > "$ENVFILE"
  chmod 600 "$ENVFILE"
  say "Настройки записаны в $ENVFILE"
  echo "  Ключ админки: $ADMIN_TOKEN"
  echo "  (сохраните его — он нужен для входа на /admin)"
fi

# ---------- 6. Пользователь и папки данных ----------
id -u inavto >/dev/null 2>&1 || useradd -r -s /usr/sbin/nologin -d "$DATA" inavto
mkdir -p "$DATA/uploads"
chown -R inavto:inavto "$DATA"

# ---------- 7. Статика сайта ----------
say "Выкладываю сайт в $WWW…"
mkdir -p "$WWW"
rsync -a --delete "$APP/site/" "$WWW/"

# ---------- 8. Служба бэкенда (systemd) ----------
say "Настраиваю службу inavto (автозапуск бэкенда)…"
cat > /etc/systemd/system/inavto.service <<'UNIT'
[Unit]
Description=INAVTO ASIA backend (API + admin)
After=network.target

[Service]
User=inavto
WorkingDirectory=/opt/inavto/backend
EnvironmentFile=/etc/inavto.env
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=3
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now inavto >/dev/null 2>&1
systemctl restart inavto

# ---------- 9. nginx ----------
say "Настраиваю nginx…"
cat > /etc/nginx/sites-available/inavto <<'NGINX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # Документы и фото уходят на бэкенд как JSON до ~70 МБ —
    # дефолтный лимит nginx в 1 МБ их режет (ошибка 413)
    client_max_body_size 100m;

    root /var/www/inavto;
    index index.html;
    charset utf-8;
    server_tokens off;

    gzip on;
    gzip_comp_level 5;
    gzip_types text/css application/javascript application/json image/svg+xml application/xml text/plain;

    # Бэкенд: API, загруженные фото, админка
    location ^~ /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location ^~ /uploads/ { proxy_pass http://127.0.0.1:3000; }
    location = /admin     { proxy_pass http://127.0.0.1:3000; }

    # Картинки, шрифты, PDF — кэш подольше.
    location ~* \.(webp|png|jpe?g|svg|ico|woff2?|pdf)$ { expires 14d; add_header Cache-Control "public"; }
    # CSS/JS: браузер каждый раз сверяется с сервером (304, если не менялось) —
    # обновления дизайна доезжают мгновенно, без «слипшихся кнопок» из старого кэша.
    location ~* \.(css|js)$ { add_header Cache-Control "no-cache"; }

    location / { try_files $uri $uri/ =404; }
}
NGINX
ln -sf /etc/nginx/sites-available/inavto /etc/nginx/sites-enabled/inavto
rm -f /etc/nginx/sites-enabled/default
nginx -t >/dev/null
systemctl reload nginx

# Если домен и HTTPS уже подключались — восстанавливаем их автоматически
# (конфиг выше пишется заново, и настройка certbot из него пропадает)
CERT_DOM=$(ls /etc/letsencrypt/live 2>/dev/null | grep -v README | head -1 || true)
if [ -n "$CERT_DOM" ]; then
  say "Нашёл сертификат для $CERT_DOM — восстанавливаю HTTPS…"
  bash "$APP/deploy/enable-domain.sh" "$CERT_DOM" || \
    echo "Автоматически не вышло. Выполните вручную: bash $APP/deploy/enable-domain.sh $CERT_DOM ваш@email"
fi

# ---------- 10. Файрвол (если включён) ----------
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
  ufw allow OpenSSH >/dev/null || true
  ufw allow "Nginx Full" >/dev/null || true
fi

# ---------- 11. Проверка ----------
say "Проверяю бэкенд…"
OK=""
for i in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then OK=1; break; fi
  sleep 0.5
done
[ -n "$OK" ] || { systemctl --no-pager -l status inavto | tail -20; fail "бэкенд не ответил. Логи: journalctl -u inavto -n 50"; }

IP=$(hostname -I 2>/dev/null | awk '{print $1}')
say "ГОТОВО!"
echo "  Сайт:    http://${IP:-<IP-сервера>}/"
echo "  Админка: http://${IP:-<IP-сервера>}/admin  (вход — по ключу админки)"
echo
echo "  Первый шаг в админке: кнопка «Импортировать 16 моделей сайта»."
echo "  Обновить сайт после правок в коде:  bash $APP/deploy/update.sh"
