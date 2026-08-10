#!/usr/bin/env bash
#
# Обновление сайта и бэкенда INAVTO ASIA до свежей версии из репозитория.
# Запуск (от root):  bash /opt/inavto/deploy/update.sh
#
set -euo pipefail

APP=/opt/inavto
WWW=/var/www/inavto
DATA=/var/lib/inavto
DB="$DATA/inavto.db"
BACKUPS="$DATA/backups"

say() { echo -e "\033[1;31m[INAVTO]\033[0m $*"; }

[ "$(id -u)" = 0 ] || { echo "Запустите от root:  sudo bash $0"; exit 1; }
cd "$APP"

# До обновления кода делаем согласованный snapshot SQLite. Каталог, CRM,
# сделки и документы остаются в /var/lib/inavto и никогда не попадают под
# rsync --delete, но резервная копия защищает и от ошибочной миграции.
CATALOG_BEFORE=""
BACKUP_FILE=""
if [ -f "$DB" ]; then
  command -v sqlite3 >/dev/null 2>&1 || {
    echo "Не найден sqlite3: сначала выполните deploy/install.sh"; exit 1;
  }
  mkdir -p "$BACKUPS"
  BACKUP_FILE="$BACKUPS/inavto-$(date -u +%Y%m%dT%H%M%SZ).db"
  say "Создаю резервную копию базы…"
  sqlite3 "$DB" ".timeout 10000" ".backup '$BACKUP_FILE'"
  CATALOG_BEFORE=$(sqlite3 "$BACKUP_FILE" "SELECT COUNT(*) FROM site_cars;")
  [ -n "$CATALOG_BEFORE" ] || { echo "Не удалось проверить каталог в backup"; exit 1; }
  chown inavto:inavto "$BACKUP_FILE"
  chmod 600 "$BACKUP_FILE"
  # Храним ежедневные/релизные snapshots 30 дней.
  find "$BACKUPS" -maxdepth 1 -type f -name 'inavto-*.db' -mtime +30 -delete
  say "Backup готов: $BACKUP_FILE (машин в каталоге: $CATALOG_BEFORE)"
fi

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
# Бэкенд дописывает сюда страницы машин из каталога админки — нужны права
chown -R inavto:inavto "$WWW"

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
  if [ -n "$CATALOG_BEFORE" ]; then
    CATALOG_AFTER=$(sqlite3 "$DB" "SELECT COUNT(*) FROM site_cars;")
    if [ "$CATALOG_AFTER" != "$CATALOG_BEFORE" ]; then
      say "КРИТИЧЕСКОЕ ПРЕДУПРЕЖДЕНИЕ: число машин изменилось: $CATALOG_BEFORE → $CATALOG_AFTER."
      say "Автоматическое восстановление не выполнялось. Backup: $BACKUP_FILE"
      exit 1
    fi
    say "Каталог проверен: $CATALOG_AFTER машин, данные сохранены."
  fi
  say "Готово: сайт и бэкенд обновлены."
else
  say "Внимание: бэкенд не ответил за 24 сек."
  say "Проверьте:  systemctl status inavto --no-pager   и   journalctl -u inavto -n 50 --no-pager"
  exit 1
fi
