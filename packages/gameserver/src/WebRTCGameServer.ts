// Patch XHR for FileLoader in threejs
import { XMLHttpRequest } from 'xmlhttprequest';
import path from 'path';
import { initializeEngine } from "@xrengine/engine/src/initializeEngine";
import { NetworkSchema } from "@xrengine/engine/src/networking/interfaces/NetworkSchema";
import config from '@xrengine/server-core/src/appconfig';
import { SocketWebRTCServerTransport } from "./SocketWebRTCServerTransport";
import { EngineSystemPresets } from '@xrengine/engine/src/initializationOptions';

(globalThis as any).XMLHttpRequest = XMLHttpRequest;

const currentPath = (process.platform === "win32" ? 'file:///' : '') + path.dirname(__filename);
const options = {
  type: EngineSystemPresets.SERVER,
  networking: {
    schema: {
      transport: SocketWebRTCServerTransport
    } as NetworkSchema,
  },
  publicPath: config.client.url,
  physxWorker: new Worker(currentPath + "/physx/loadPhysXNode.ts"),
};

export class WebRTCGameServer {
  static instance: WebRTCGameServer = null
  constructor(app: any) {
    (options.networking as any).app = app;
    WebRTCGameServer.instance = this;
  }
  initialize() {
    return initializeEngine(options);
  }
}
