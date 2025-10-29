import serverless from "serverless-http";

let cachedHandler: any = null;

async function getHandler() {
  if (cachedHandler) return cachedHandler;

  try {
    // Prefer built dist server when available
    const mod = await import("../../dist/server/index.mjs");
    if (mod && mod.createServer) {
      cachedHandler = serverless(mod.createServer());
      return cachedHandler;
    }
  } catch (e) {
    // ignore; fallback to source server
  }

  const src = await import("../../server");
  cachedHandler = serverless(src.createServer());
  return cachedHandler;
}

export const handler = async (event: any, context: any) => {
  const h = await getHandler();
  return h(event, context);
};
