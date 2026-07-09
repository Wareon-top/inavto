#!/usr/bin/env bash
#
# Подключение домена и бесплатного HTTPS-сертификата (Let's Encrypt).
# Перед запуском: у регистратора домена создайте A-записи «@» и «www» на IP сервера.
#
# Запуск (от root):  bash /opt/inavto/deploy/enable-domain.sh inavtoasia.ru ваш@email
#
set -euo pipefail

DOMAIN="${1:?Укажите домен, например:  bash $0 inavtoasia.ru ваш@email}"
EMAIL="${2:-}"

say()  { echo -e "\n\033[1;34m[INAVTO]\033[0m $*"; }
fail() { echo -e "\n\033[1;31mОШИБКА:\033[0m $*"; exit 1; }

[ "$(id -u)" = 0 ] || fail "запустите от root"

# ---------- 1. Проверяем, что DNS уже указывает на этот сервер ----------
SERVER_IP=$(hostname -I | awk '{print $1}')
DOMAIN_IP=$(getent hosts "$DOMAIN" | awk '{print $1}' | head -1 || true)
if [ -z "$DOMAIN_IP" ]; then
  fail "домен $DOMAIN пока никуда не указывает.
Создайте у регистратора A-записи «@» и «www» на $SERVER_IP,
подождите 15–60 минут и запустите скрипт ещё раз."
fi
if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
  fail "домен $DOMAIN указывает на $DOMAIN_IP, а этот сервер — $SERVER_IP.
Проверьте A-записи у регистратора; если меняли недавно — подождите и повторите."
fi
say "DNS в порядке: $DOMAIN → $SERVER_IP"

# ---------- 2. Прописываем домен в nginx ----------
sed -i "s/server_name .*;/server_name $DOMAIN www.$DOMAIN;/" /etc/nginx/sites-available/inavto
nginx -t >/dev/null && systemctl reload nginx
say "nginx знает домен."

# ---------- 3. Выпускаем сертификат и включаем https ----------
say "Ставлю certbot и выпускаю сертификат…"
export DEBIAN_FRONTEND=noninteractive
apt-get install -y -qq certbot python3-certbot-nginx >/dev/null
if [ -n "$EMAIL" ]; then MAILOPT=(-m "$EMAIL"); else MAILOPT=(--register-unsafely-without-email); fi
# --keep-until-expiring: повторный запуск безопасен — сертификат переиспользуется
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --redirect --agree-tos --no-eff-email -n --keep-until-expiring "${MAILOPT[@]}"

say "ГОТОВО!"
echo "  Сайт:    https://$DOMAIN/"
echo "  Админка: https://$DOMAIN/admin"
echo "  Сертификат продлевается автоматически (systemd-таймер certbot)."
