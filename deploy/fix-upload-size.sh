#!/usr/bin/env bash
#
# Фикс лимита загрузки: nginx резал большие файлы (в конфиге сайта стоял
# client_max_body_size 12m, а по умолчанию у nginx вообще 1m) — документы
# и пачки фото не доходили до бэкенда (ошибка 413).
# Поднимаем лимит до 100 МБ везде, где он встречается. Запуск повторно безопасен.
#
# Запуск (от root):  bash /opt/inavto/deploy/fix-upload-size.sh
#
set -euo pipefail

say()  { echo -e "\n\033[1;34m[INAVTO]\033[0m $*"; }
fail() { echo -e "\n\033[1;31mОШИБКА:\033[0m $*"; exit 1; }

[ "$(id -u)" = 0 ] || fail "запустите от root"

# 1. Общий лимит для всего nginx (уровень http)
printf 'client_max_body_size 100m;\n' > /etc/nginx/conf.d/inavto-upload-size.conf

# 2. Лимиты внутри конфигов сайта перекрывают общий — приводим их к 100m.
for f in /etc/nginx/sites-available/inavto /etc/nginx/sites-available/inavto-lk; do
  [ -f "$f" ] || continue
  sed -i 's/client_max_body_size[[:space:]]\+[0-9]\+[kKmM]\?;/client_max_body_size 100m;/g' "$f"
done

nginx -t >/dev/null || fail "nginx не принял конфиг — пришлите вывод: nginx -t"
systemctl reload nginx

say "ГОТОВО: nginx принимает файлы до 100 МБ (документы — до 50 МБ на файл)."
echo "  Проверьте: журнал сделок → карточка → прикрепите документ или фото."
