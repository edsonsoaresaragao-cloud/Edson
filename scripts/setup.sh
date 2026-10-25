#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ ! -f .env ]; then
  node --input-type=module <<'JS'
import {readFileSync,writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
const db=randomBytes(24).toString('hex'), storage=randomBytes(24).toString('hex');
let text=readFileSync('.env.example','utf8').replace('CHANGE_ME',db).replace('SESSION_SECRET=','SESSION_SECRET='+randomBytes(48).toString('hex')).replace('POSTGRES_PASSWORD=','POSTGRES_PASSWORD='+db).replace('MINIO_ROOT_PASSWORD=','MINIO_ROOT_PASSWORD='+storage).replace('S3_ACCESS_KEY=','S3_ACCESS_KEY=S3RVER').replace('S3_SECRET_KEY=','S3_SECRET_KEY=S3RVER');
writeFileSync('.env',text,{mode:0o600});
JS
fi
npm ci --no-fund --no-audit
npm run db:generate
docker compose up -d --wait db
npm run db:migrate
npm run db:seed
echo "Banco preparado. Inicie npm run storage:dev e então npx tsx scripts/storage-init.ts."
