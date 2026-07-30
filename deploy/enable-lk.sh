#!/usr/bin/env bash
#
# Подключение личного кабинета клиентов на поддомене lk.<домен> + HTTPS.
# Перед запуском: в DNS-панели (Sprinthost) создайте A-запись «lk» на IP сервера.
#
# Запуск (от root):  bash /opt/inavto/deploy/enable-lk.sh inavtoasia.ru ваш@email
#
set -euo pipefail

DOMAIN="${1:?Укажите домен, например:  bash $0 inavtoasia.ru ваш@email}"
EMAIL="${2:-}"
LK="lk.$DOMAIN"

say()  { echo -e "\n\033[1;34m[INAVTO]\033[0m $*"; }
fail() { echo -e "\n\033[1;31mОШИБКА:\033[0m $*"; exit 1; }

[ "$(id -u)" = 0 ] || fail "запустите от root"

# ---------- 1. Проверяем, что DNS уже указывает на этот сервер ----------
SERVER_IP=$(hostname -I | awk '{print $1}')
LK_IP=$(getent hosts "$LK" | awk '{print $1}' | head -1 || true)
if [ -z "$LK_IP" ]; then
  fail "поддомен $LK пока никуда не указывает.
В DNS-панели (Sprinthost) создайте A-запись с именем «lk» на $SERVER_IP,
подождите 15–60 минут и запустите скрипт ещё раз."
fi
if [ "$LK_IP" != "$SERVER_IP" ]; then
  fail "поддомен $LK указывает на $LK_IP, а этот сервер — $SERVER_IP.
Проверьте A-запись «lk»; если меняли недавно — подождите и повторите."
fi
say "DNS в порядке: $LK → $SERVER_IP"

# ---------- 2. Отдельный nginx-конфиг для кабинета ----------
# Наружу открыты только сам кабинет, его API и загруженные файлы.
# Поисковикам вход запрещён (X-Robots-Tag + robots.txt).
cat > /etc/nginx/sites-available/inavto-lk <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name LK_DOMAIN_PLACEHOLDER;

    add_header X-Robots-Tag "noindex, nofollow" always;

    location = /robots.txt {
        add_header Content-Type text/plain;
        return 200 "User-agent: *\nDisallow: /\n";
    }

    location = / {
        proxy_pass http://127.0.0.1:3000/lk;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location ^~ /api/lk/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location ^~ /uploads/ { proxy_pass http://127.0.0.1:3000; }

    # Всё остальное (включая /admin и прочие /api) на этом поддомене закрыто
    location / { return 404; }
}
NGINX
sed -i "s/LK_DOMAIN_PLACEHOLDER/$LK/" /etc/nginx/sites-available/inavto-lk
ln -sf /etc/nginx/sites-available/inavto-lk /etc/nginx/sites-enabled/inavto-lk
nginx -t >/dev/null && systemctl reload nginx
say "nginx знает поддомен кабинета."

# ---------- 3. Выпускаем сертификат и включаем https ----------
say "Выпускаю сертификат для $LK…"
export DEBIAN_FRONTEND=noninteractive
apt-get install -y -qq certbot python3-certbot-nginx >/dev/null
if [ -n "$EMAIL" ]; then MAILOPT=(-m "$EMAIL"); else MAILOPT=(--register-unsafely-without-email); fi
certbot --nginx -d "$LK" --redirect --agree-tos --no-eff-email -n --keep-until-expiring "${MAILOPT[@]}"

say "ГОТОВО!"
echo "  Личный кабинет: https://$LK/?k=<токен-клиента>"
echo "  Ссылку для конкретного клиента копируйте в админке — карточка сделки,"
echo "  кнопка «Скопировать ссылку для клиента»."
echo "  На основном сайте кабинет нигде не упоминается; поисковикам вход запрещён."
