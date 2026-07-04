import 'dotenv/config';
import { spawn } from 'child_process';
import { Hocuspocus } from '@hocuspocus/server';
import express from 'express';
import expressWs from 'express-ws';
import cors from 'cors';
import { marple } from 'marple';

process.env.PORT = '8080';
process.env.USE_MOCK_REDIS = 'true';

import('@whogoes/server').catch(console.error);

const { app } = expressWs(express());
app.use(cors());

import pg from 'pg';
import { Database } from '@hocuspocus/extension-database';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.query(`
  CREATE TABLE IF NOT EXISTS yjs_documents (
    name TEXT PRIMARY KEY,
    data BYTEA NOT NULL
  )
`).catch(console.error);

const hocuspocus = new Hocuspocus({
  extensions: [
    new Database({
      fetch: async ({ documentName }) => {
        const res = await pool.query('SELECT data FROM yjs_documents WHERE name = $1', [documentName]);
        if (res.rows.length > 0) return res.rows[0].data;
        return null;
      },
      store: async ({ documentName, state }) => {
        await pool.query(
          'INSERT INTO yjs_documents (name, data) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET data = $2',
          [documentName, state]
        );
      }
    })
  ],
  async onConnect(data) {
    await marple.track('user_connected', { plan: 'free', documentName: data.documentName }).catch(console.error);
  },
  async onLoadDocument(data) {
    await marple.track('board_created', { plan: 'free', documentName: data.documentName }).catch(console.error);
    return data.document;
  }
});

app.ws('/:documentName', (ws, req) => {
  hocuspocus.handleConnection(ws as any, req as any);
});

marple.init({
  storage: 'postgres',
  connectionString: process.env.DATABASE_URL,
}).then(() => {
  console.log('Marple analytics DB initialized with postgres');
  
  app.use('/marple', marple.dashboard({
    authenticate: async () => true
  }));

  app.listen(3000, () => {
    console.log('Server running on port 3000 (Express + Marple + Hocuspocus)');
  });
}).catch(console.error);
