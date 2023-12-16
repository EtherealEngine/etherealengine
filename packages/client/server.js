
/*
CPAL-1.0 License

The contents of this file are subject to the Common Public Attribution License
Version 1.0. (the "License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at
https://github.com/EtherealEngine/etherealengine/blob/dev/LICENSE.
The License is based on the Mozilla Public License Version 1.1, but Sections 14
and 15 have been added to cover use of software over a computer network and 
provide for limited attribution for the Original Developer. In addition, 
Exhibit A has been modified to be consistent with Exhibit B.

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for the
specific language governing rights and limitations under the License.

The Original Code is Ethereal Engine.

The Original Developer is the Initial Developer. The Initial Developer of the
Original Code is the Ethereal Engine team.

All portions of the code written by the Ethereal Engine team are Copyright © 2021-2023 
Ethereal Engine. All Rights Reserved.
*/


const { join } = require('path');
const { readFileSync } = require('fs');
const koa = require('koa');
const serve = require('koa-static');
const sendFile = require('koa-send')
const { path: packageRoot } = require('app-root-path');
const { createServer } = require('https');
const { createServer: _createServer } = require('http');


const app = new koa();
const PORT = process.env.HOST_PORT || 3000;
const HTTPS = process.env.VITE_LOCAL_BUILD ?? false;

app.use(serve(join(packageRoot, 'packages', 'client', 'dist'), {
  brotli: true,
  setHeaders: (ctx) => {
    ctx.setHeader('Origin-Agent-Cluster', '?1')
  }
}));

app.use(async (ctx) => {
  await sendFile(ctx, join('dist', 'index.html'), {
    root: join(packageRoot, 'packages', 'client')
  });
});

app.listen = function () {
  let server;
  if (HTTPS) {
    const key = readFileSync(join(packageRoot, process.env.key))
    const cert = readFileSync(join(packageRoot, process.env.cert))
    server = createServer({key: key, cert: cert }, this.callback());
  } else {
    server = _createServer(this.callback());
  }
  return server.listen.apply(server, arguments);
};

app.listen(PORT, '0.0.0.0', () => console.log(`Server listening on port: ${PORT}`));
