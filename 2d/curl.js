// const { Curl } = require("node-libcurl");

class Curl {
  static option = {};
  setOpt(str, str2) {}
  on(event, func) {}
  perform() {}
}

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
            val.indexOf('"') === 0 &&
            val.lastIndexOf('"') === val.length - 1
          ) {
            val = val.slice(1, val.length - 1);
          }
          curl.setOpt(Curl.option[opt], val);
        } else {
          console.log("unsupported curl opt", rawopt);
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

const handler = async (req, res) => {
  const body = req.data;
  const json = JSON.parse(body);
  const curlResult = await handleCurlCommand(json).catch((e) => ({
    error: e.error,
    code: e.code,
  }));
  if (curlResult.status !== 200) {
    console.log("something went wrong");
  }
  res.writeHead(curlResult.status, "STUFF = CURLED");
  res.end(curlResult.data);
};

module.exports = { handleCurlCommand, handler };
