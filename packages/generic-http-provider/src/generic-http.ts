import debug from "debug";
const log = debug("WebIO:generic-http-provider");

import WebIO from "@webio/webio";

declare global {
  interface Window {
    _webIOWebSocketURL?: string;
  }
}

/**
 * Get the standard url of the WebIO WebSocket.
 */
export const getWSUrl = (): string => {
  if (window._webIOWebSocketURL) {
    return window._webIOWebSocketURL;
  }
  const {protocol, host, pathname} = window.location;
  const wsProtocol = protocol == "https:" ? "wss:" : "ws:";
  const basePath = pathname[pathname.length - 1] == "/" ? pathname : pathname + "/";
  const wsPath = basePath + "webio-socket";

  return `${wsProtocol}//${host}${wsPath}`;
};

/**
 * Create a WebIO instance connected to a WebSocket.
 * @param webIO - the WebIO instance to connect.
 * @param wsUrl - the url of the WebSocket to connect to.
 */
export const connectWebIOToWebSocket = (
  webIO: WebIO,
  wsUrl: string = getWSUrl(),
) => {
  return new Promise<void>((resolve, reject) => {
    const webSocket = new WebSocket(wsUrl);

    webSocket.onopen = () => {
      webIO.setSendCallback((msg: any) => {
        webSocket.send(JSON.stringify(msg));
      });
      resolve();
    };

    webSocket.onclose = (closeEvent) => {
      // Rejecting a resolved or already-rejected promise is a no-op.
      reject(closeEvent);
    };

    webSocket.onerror = (error) => {
      // Rejecting a resolved or already-rejected promise is a no-op.
      reject(error);
    };

    webSocket.onmessage = ({data}) => {
      const message = JSON.parse(data);
      webIO.dispatch(message);
    }
  })
};


const genericHTTPEntrypoint = async () => {
  const webIO = new WebIO();
  // We do window as any to allow defining new members.
  (window as any).WebIO = webIO;
  await connectWebIOToWebSocket(webIO);
  log("Connected WebIO to WebSocket.")
};

genericHTTPEntrypoint();
