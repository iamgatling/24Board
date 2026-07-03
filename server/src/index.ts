import { spawn } from 'child_process';
import { Server } from '@hocuspocus/server';

process.env.PORT = '8080';
process.env.USE_MOCK_REDIS = 'true';

import('@whogoes/server').catch(console.error);

const hocuspocusServer = new Server({
  port: 1234,
});

hocuspocusServer.listen().then(() => {
  console.log('server listening on port 1234');
});
