let count = 0;
const id = setInterval(() => {
  count++;
  const prizepool = document.getElementById("prizepool");
  if (prizepool) {
    switch (count % 4) {
      case 0:
        prizepool.innerHTML = "Loading";
        break;
      case 1:
        prizepool.innerHTML = "Loading.";
        break;
      case 2:
        prizepool.innerHTML = "Loading..";
        break;
      case 3:
        prizepool.innerHTML = "Loading...";
        break;
    }
  }
}, 350);

const getPrizePool = (
  /** @type {string | URL} */ url,
  /** @type {{ (res: string): void; (arg0: any): void; }} */ callback,
) => {
  if (!window.XMLHttpRequest) return;

  const xhr = new XMLHttpRequest();

  xhr.onload = () => {
    if (callback && typeof callback === "function") {
      callback(xhr.response);
    }
  };

  xhr.open("GET", url);
  xhr.setRequestHeader("x-requested-with", "XMLHttpRequest");
  xhr.send();
};

const url =
  "https://cors-anywhere.herokuapp.com/https://www.dota2.com/international/battlepass";

getPrizePool(url, (/** @type {string} */ res) => {
  const regex = /prize_pool_headline">(.*)/gm;
  const match = regex.exec(res);
  if (match) {
    let prize = match[1];
    prize = prize.substring(0, prize.indexOf("</div>"));
    const pool = document.getElementById("prizepool");
    clearInterval(id);
    if (pool) pool.innerHTML = prize;
  }
});
