
// Main worker code
export default {
  async fetch(request, env, ctx) {
    const start = Date.now();
    const result = {durations: {}};

    // get the singleton DO instance's stub in WNAM
    const startStub = Date.now();
    const stub = env.DurableInstanceFetch.get(env.DurableInstanceFetch.idFromName("1"), { locationHint: 'wnam' });
    result.durations.getDurableObjectStub = `${Date.now() - startStub}ms`;

    // DO stub.fetch()
    const startFetch = Date.now();
    const res = await stub.fetch(new Request("http://durable-object/buffered", request));
    result.durations.stubFetch = `${Date.now() - startFetch}ms`;
    result.type = "durable-object-fetch-array-buffer";

    const startBody = Date.now();
    const body = await res.arrayBuffer();
    result.durations.bodyDownload = `${Date.now() - startBody}ms`;
    result.bytesDownloaded = body.byteLength;

    // total
    result.durations.totalTime = `${Date.now() - start}ms`;

    return Response.json(result);
  },
};


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