#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ "${CONFIRM_RESTORE:-}" != edson ]; then
  echo 'Restauração altera o banco de destino. Use um banco vazio e CONFIRM_RESTORE=edson após revisar o arquivo.' >&2
  exit 1
fi
backup_file="${1:?Informe o caminho do backup .sql.gz}"
sha256sum -c "$backup_file.sha256"
gzip -t "$backup_file"
gzip -dc "$backup_file" | docker compose -f "${EDSON_COMPOSE_FILE:-compose.prod.yaml}" exec -T db psql -v ON_ERROR_STOP=1 -U edson -d edson
