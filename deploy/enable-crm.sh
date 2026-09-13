#!/usr/bin/env bash
# Отдельная закрытая CRM на crm.<домен>. Не связана с публичным сайтом или /admin.
# Перед запуском создайте в DNS A-запись «crm» на IP этого сервера.
# Запуск от root: bash /opt/inavto/deploy/enable-crm.sh inavtoasia.ru ваш@email
set -euo pipefail

DOMAIN="${1:?Укажите домен, например: bash $0 inavtoasia.ru ваш@email}"
EMAIL="${2:-}"
CRM="crm.$DOMAIN"
say(){ echo -e "\n\033[1;34m[INAVTO CRM]\033[0m $*"; }
fail(){ echo -e "\n\033[1;31mОШИБКА:\033[0m $*"; exit 1; }
[ "$(id -u)" = 0 ] || fail "запустите от root"

SERVER_IP=$(hostname -I | awk '{print $1}')
CRM_IP=$(getent hosts "$CRM" | awk '{print $1}' | head -1 || true)
[ -n "$CRM_IP" ] || fail "Создайте A-запись crm → $SERVER_IP, подождите распространения DNS и повторите."
[ "$CRM_IP" = "$SERVER_IP" ] || fail "crm указывает на $CRM_IP, а сервер имеет IP $SERVER_IP. Проверьте DNS."
say "DNS в порядке: $CRM → $SERVER_IP"

cat > /etc/nginx/sites-available/inavto-crm <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name CRM_DOMAIN_PLACEHOLDER;
    add_header X-Robots-Tag "noindex, nofollow" always;

    location = /robots.txt {
        add_header Content-Type text/plain;
        return 200 "User-agent: *\nDisallow: /\n";
    }
    location = / { proxy_pass http://127.0.0.1:3000/crm; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme; }
    location ^~ /api/crm/ { proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme; }
    location / { return 404; }
}
NGINX
sed -i "s/CRM_DOMAIN_PLACEHOLDER/$CRM/" /etc/nginx/sites-available/inavto-crm
ln -sf /etc/nginx/sites-available/inavto-crm /etc/nginx/sites-enabled/inavto-crm
nginx -t >/dev/null && systemctl reload nginx
apt-get install -y -qq certbot python3-certbot-nginx >/dev/null
if [ -n "$EMAIL" ]; then MAILOPT=(-m "$EMAIL"); else MAILOPT=(--register-unsafely-without-email); fi
certbot --nginx -d "$CRM" --redirect --agree-tos --no-eff-email -n --keep-until-expiring "${MAILOPT[@]}"
say "Готово: https://$CRM"
