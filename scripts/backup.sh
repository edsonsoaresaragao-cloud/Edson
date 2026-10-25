#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
umask 077
backup_dir="${BACKUP_DIR:-./backups}"
mkdir -p "$backup_dir"
backup_file="$backup_dir/edson-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
docker compose -f "${EDSON_COMPOSE_FILE:-compose.prod.yaml}" exec -T db pg_dump -U edson -d edson --no-owner --no-acl | gzip > "$backup_file"
gzip -t "$backup_file"
sha256sum "$backup_file" > "$backup_file.sha256"
echo "Backup PostgreSQL criado e validado. Copie para armazenamento externo protegido."
