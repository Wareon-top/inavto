#!/usr/bin/env bash
# Обновление изображений каталога на сервере одной командой.
#   bash /opt/inavto/deploy/update-images.sh --all
#   bash /opt/inavto/deploy/update-images.sh --brand "BYD"
#   bash /opt/inavto/deploy/update-images.sh --missing-images --dry-run
set -euo pipefail
set -a; . /etc/inavto.env; set +a
cd /opt/inavto/backend
exec node tools/update-images.mjs "$@"
