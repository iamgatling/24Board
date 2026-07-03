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

const hocuspocus = new Hocuspocus();

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
