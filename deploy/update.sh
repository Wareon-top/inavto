#!/usr/bin/env bash
#
# Обновление сайта и бэкенда INAVTO ASIA до свежей версии из репозитория.
# Запуск (от root):  bash /opt/inavto/deploy/update.sh
#
set -euo pipefail

APP=/opt/inavto
WWW=/var/www/inavto

say() { echo -e "\033[1;31m[INAVTO]\033[0m $*"; }

[ "$(id -u)" = 0 ] || { echo "Запустите от root:  sudo bash $0"; exit 1; }
cd "$APP"

say "Забираю свежий код…"
LOCK_BEFORE=$(md5sum backend/package-lock.json | cut -d' ' -f1)
git pull --ff-only
LOCK_AFTER=$(md5sum backend/package-lock.json | cut -d' ' -f1)

if [ "$LOCK_BEFORE" != "$LOCK_AFTER" ]; then
  say "Обновляю зависимости бэкенда…"
  (cd backend && npm ci --omit=dev --no-audit --no-fund >/dev/null)
fi

say "Выкладываю статику сайта…"
rsync -a --delete "$APP/site/" "$WWW/"

say "Перезапускаю бэкенд…"
systemctl restart inavto

# Ждём, пока бэкенд поднимется. На тарифе 512 МБ холодный старт бывает
# медленным (несколько секунд), поэтому опрашиваем health до ~24 секунд,
# а не одну секунду — иначе бывает ложное «не ответил».
ok=0
for _ in $(seq 1 12); do
  if curl -fsS "http://127.0.0.1:3000/api/health" >/dev/null 2>&1; then ok=1; break; fi
  sleep 2
done

if [ "$ok" = 1 ]; then
  say "Готово: сайт и бэкенд обновлены."
else
  say "Внимание: бэкенд не ответил за 24 сек."
  say "Проверьте:  systemctl status inavto --no-pager   и   journalctl -u inavto -n 50 --no-pager"
  exit 1
fi
