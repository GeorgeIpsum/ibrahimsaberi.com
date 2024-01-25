const { Server } = require("node:http");
const { createHmac } = require("node:crypto");
const curl = require("./curl");

const authPasses = {};
const createAuthPass = (url) => {
  const key = createHmac("sha256", JSON.stringify({ url }));
  authPasses[key] = {};
};

const emptyHandler = async (req, res) => {
  res.writeHead(404);
  res.end("B)");
};

const routes = [{ url: "", methods: [], func: emptyHandler }];
const reqMatcher = (req) => [req.method, req.url.split("/")[1]];
function getFunc(method, url) {
  const route = routes.find((route) => route.url === url);
  if (!route) {
    console.log("NO ROUTE FOUND FOR ROUTE", url);
    return emptyHandler;
  }
  return route.methods.find((m) => m.method === method)?.func ?? route.func;
}
function register(url, method, func) {
  const exists = routes.find((route) => route.url === url);
  if (!exists) {
    routes.push({ url, methods: [{ method, func }], func });
  } else {
    exists.methods.push({ method, func });
    exists.func = func;
  }
}
async function setReqData(req) {
  return new Promise((resolve) => {
    let requestData = "";
    req.on("data", (datum) => {
      requestData += datum;
    });
    req.on("close", async () => {
      const body = requestData.toString("utf-8");
      req.data = body;
      resolve();
    });
  });
}
async function run(req, res) {
  const [method, url] = reqMatcher(req);
  const func = getFunc(method, url);
  await setReqData(req);
  return await func(req, res);
}

register("curl", "POST", curl.handler);
const server = new Server(async (req, res) => {
  console.log("Received request:", req.method, req.url);
  try {
    await run(req, res);
  } catch (e) {
    console.log(e);
    console.log("FAILED");
  }
});

const host = "localhost";
const port = 3001;
server.listen(3001, "localhost", () => {
  console.log("Internal server listening at");
  console.log(`http://${host}:${port}`);
});
