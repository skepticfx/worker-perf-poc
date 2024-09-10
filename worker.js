
// Route handlers
const handlers = {
  // Durable object fetch
  '/json': (env, request) => observeDurableObject(env, request, 'json'),
  '/arraybuffer': (env, request) => observeDurableObject(env, request, 'arraybuffer'),
  '/text': (env, request) => observeDurableObject(env, request, 'text'),
};

// Main worker code
export default {
  async fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;
    const handler = handlers[path];
    if(!handler){
      return Response.json( {error: 'Not found. Try - /json or /arraybuffer or /text'}, { status: 404 });
    }
    return Response.json(await handler(env, request));
  },
};


// Access Durable object via RPC or Fetch
async function observeDurableObject(env, request, parsingType) {
  // get the singleton DO instance in WNAM
  const stub = env.DurableInstanceFetch.get(env.DurableInstanceFetch.idFromName("1"), { locationHint: 'wnam' });

  // calculate TTFB. The time before we start downloading the response
  const startTTFB = Date.now();
  const res = await stub.fetch(new Request("http://durable-object/buffered", request));
  const ttfb = Date.now() - startTTFB;

  // pick parsing type - arraybuffer/json/text
  // calculate Time to download
  const startDownload = Date.now();
  let ttd = 0;
  let resLen = 0;
  let download;
  switch(parsingType){
    case "arraybuffer":
      download = await res.arrayBuffer();
      ttd = Date.now() - startDownload;
      resLen = download.byteLength;
      break;
    case "json":
      download = await res.json();
      ttd = Date.now() - startDownload;
      resLen = JSON.stringify(res).length;
      break;
    case "text":
      download = await res.text();
      ttd = Date.now() - startDownload;
      resLen = res.length;
      break;
    default:
    throw new Error("unsupported response parsing type");
  }

  const totalTime = Date.now() - startTTFB;

  const result = {
    type: parsingType,
    ttfb: `${ttfb}ms`,
    downloadTime: `${ttd}ms`,
    totalTime: `${totalTime}ms`,
    totalBytes: resLen,
  };

  return result;
}

// Durable Object

// Durable object Class via Fetch
export class DurableInstanceFetch {
    constructor(state, env) {
      this.state = state;
      this.env = env;
      this.bufferedData = generateRandomString(1024 * 1024 * 10).toString(); // ~ 10 MB;
    }
  
    async fetch(request) {
      const start = Date.now();
      const res = Response.json({results: this.bufferedData, meta: {duration: Date.now() - start}});
      return res;
    }
  }

  function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }