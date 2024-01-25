const { Server } = require("node:http");
const { Curl } = require("node-libcurl");

const handleCurlCommand = async ({ ua, libcurlC }) => {
  if (!ua) throw new Error("user agent not defined");
  if (!libcurlC) throw new Error("curl command not");

  const promise = new Promise((resolve, reject) => {
    const curl = new Curl();
    curl.setOpt("USERAGENT", ua);

    const cToLines = libcurlC.split("\n");
    cToLines.forEach((line) => {
      const isSetOpt = line.includes("curl_easy_setopt(hnd,");
      if (isSetOpt) {
        const [_, rawopt, rawval] = new RegExp(
          /curl_easy_setopt\(hnd,.?(\S*),.?(\S*)\);/
        ).exec(line);
        const opt = rawopt.split("CURLOPT_")[1];
        if (opt in Curl.option) {
          let val = rawval;
          if (
            // eslint-disable-next-line
            val.indexOf('\"') === 0 &&
            // eslint-disable-next-line
            val.lastIndexOf('\"') === val.length - 1
          ) {
            val = val.slice(1, val.length - 1);
          }
          curl.setOpt(Curl.option[opt], val);
        } else {
          console.log("unsupported curl opt", rawopt, val);
        }
      }
    });
    curl.on("end", (status, data) => {
      resolve({
        status,
        data,
      });
    });
    curl.on("error", (error, code) => {
      reject({
        error,
        code,
      });
    });
    curl.perform();
  });

  const res = await promise;

  return res;
};

const server = new Server(async (req, res) => {
  console.log("Received request:", req.method, req.url);
  if (req.method === "POST" && req.url.split("/")[1] === "curl") {
    let requestData = "";
    req.on("data", (datum) => {
      requestData += datum;
    });
    req.on("close", async () => {
      const body = requestData.toString("utf-8");
      const json = JSON.parse(body);
      const curlResult = await handleCurlCommand(json).catch((e) => ({
        error: e.error,
        code: e.code,
      }));
      if (curlResult.status !== 200) {
        console.log("something went wrong");
      }
      res.writeHead(200, "STUFF = CURLED");
      res.end(curlResult.data);
    });
  } else {
    res.writeHead(200);
    return res.end(`${req.method}\n${req.url}\n\nB) whattup puddin cup\n`);
  }
});

const host = "localhost";
const port = 3001;
server.listen(3001, "localhost", () => {
  console.log("Internal server listening at");
  console.log(`http://${host}:${port}`);
});
