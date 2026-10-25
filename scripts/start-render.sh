#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export APP_URL="${APP_URL:-${RENDER_EXTERNAL_URL:-}}"
node --input-type=module <<'JS'
const raw=process.env.APP_URL;
if(!raw)throw new Error('Render: APP_URL ou RENDER_EXTERNAL_URL não foi definido.');
const url=new URL(raw);
if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw new Error('Render: configure uma origem HTTPS válida para APP_URL.');
if(!process.env.DATABASE_URL)throw new Error('Render: DATABASE_URL não foi configurado.');
if(!process.env.SESSION_SECRET||process.env.SESSION_SECRET.length<32)throw new Error('Render: SESSION_SECRET precisa ter pelo menos 32 caracteres.');
JS
npm run db:migrate
node scripts/seed-if-empty.mjs
server_entry=server.js
if [ ! -f "$server_entry" ] && [ -f .next/standalone/server.js ]; then
  server_entry=.next/standalone/server.js
fi
if [ ! -f "$server_entry" ]; then
  echo 'Artefato standalone ausente: use a imagem Docker de produção.' >&2
  exit 1
fi
exec node "$server_entry"
