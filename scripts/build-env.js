#!/usr/bin/env node
// ═══════════════════════════════════════════
//  scripts/build-env.js
//  Executado antes do deploy na Vercel.
//  Gera public/env.js com as variáveis de ambiente.
//
//  Adicione no package.json:
//    "scripts": { "build": "node scripts/build-env.js" }
//
//  E configure no Vercel Dashboard:
//    Settings → Environment Variables:
//      SUPABASE_URL      → https://<ref>.supabase.co
//      SUPABASE_ANON_KEY → eyJ...
// ═══════════════════════════════════════════

const fs   = require('fs');
const path = require('path');

const url  = process.env.SUPABASE_URL;
const key  = process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('[build-env] SUPABASE_URL ou SUPABASE_ANON_KEY não definidas.');
  process.exit(1);
}

const content = `// Gerado automaticamente pelo build — NÃO edite manualmente
window.__ENV__ = ${JSON.stringify({ SUPABASE_URL: url, SUPABASE_ANON_KEY: key }, null, 2)};
`;

const outPath = path.join(__dirname, '..', 'env.js');
fs.writeFileSync(outPath, content, 'utf8');
console.log('[build-env] public/env.js gerado com sucesso.');
