require("dotenv").config();

const { Server } = require("node:http");
const { createHmac } = require("node:crypto");
const basin = require("./basin");

const COLORS = {
  yellow: 33,
  green: 32,
  blue: 34,
  blueBg: "44;1",
  red: 31,
  grey: 90,
  magenta: 35,
  magentaBg: "45;1",
  cyanBg: 46,
  clear: 39,
  reset: 0,
};

const maxLineLength = 32;

/**
 * buh???
 *
 * @param {keyof typeof COLORS} color color to use
 * @param {*} string string to colorize
 * @returns returns string with escape sequences colorizing in ansi shell i guess idk
 */
const colorize = (color, string) =>
  `\u001b[${COLORS[color]}m${string}\u001b[0m`;

const log = (...args) =>
  console.log(
    colorize("blueBg", "".padStart(maxLineLength)) + "\n",
    colorize("magentaBg", " ") + colorize("blueBg", "⏥"),
    "",
    args
      .map((arg) => colorize("magentaBg", `  ${arg}`.padEnd(maxLineLength - 5)))
      .join(`\n ${colorize("magentaBg", " ")}   `),
    "\n" +
      colorize("blueBg", " ") +
      colorize("magentaBg", "".padEnd(maxLineLength - 1))
  );

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
  const route = routes.find((route) => route.url === url.split("?")[0]);
  if (!route) {
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

register("basin", "GET", basin.handler);
const server = new Server(async (req, res) => {
  log("Received request:", req.method, req.url);
  try {
    const final = await run(req, res);
    res.writeHead(final.status);
    return res.end(final.body);
  } catch (e) {
    log(e, "FAILED");
  }
});

const host = "localhost";
const port = 3001;
server.listen(3001, "localhost", () => {
  log("2D Server Live", `http://${host}:${port}`);
});
