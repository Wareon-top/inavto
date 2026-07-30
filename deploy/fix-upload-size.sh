#!/usr/bin/env bash
#
# Разовый фикс: nginx по умолчанию не пропускает запросы больше 1 МБ,
# из-за этого документы и пачки фото не доходили до бэкенда (ошибка 413).
# Поднимаем лимит до 30 МБ для всего сервера.
#
# Запуск (от root):  bash /opt/inavto/deploy/fix-upload-size.sh
#
set -euo pipefail

say()  { echo -e "\n\033[1;34m[INAVTO]\033[0m $*"; }
fail() { echo -e "\n\033[1;31mОШИБКА:\033[0m $*"; exit 1; }

[ "$(id -u)" = 0 ] || fail "запустите от root"

printf 'client_max_body_size 30m;\n' > /etc/nginx/conf.d/inavto-upload-size.conf
nginx -t >/dev/null || fail "nginx не принял конфиг — пришлите вывод: nginx -t"
systemctl reload nginx

say "ГОТОВО: nginx принимает файлы до 30 МБ."
echo "  Проверьте: журнал сделок → карточка → прикрепите документ или фото."
