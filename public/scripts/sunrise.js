const theSunRises = () => {
  const image = document.querySelector("img[alt='sunrise']");
  if (image && "src" in image && image.src) {
    const baseUrl = "/img/sunrise/";
    const images = [
      "0.jpg",
      "0.jpg",
      "1.jpg",
      "2.jpg",
      "3.jpg",
      "4.jpg",
      "5.jpg",
      "6.jpg",
      "7.jpg",
      "8.jpg",
      "8.jpg",
      "9.jpg",
      "9.jpg",
      "8.jpg",
      "8.jpg",
      "7.jpg",
      "6.jpg",
      "5.jpg",
      "4.jpg",
      "3.jpg",
      "2.jpg",
      "1.jpg",
      "0.jpg",
      "0.jpg",
    ];
    const hour = new Date().getHours();

    const loop = (
      /** @type {number} */ index,
      /** @type {number} */ indexToStop,
    ) => {
      if (index < indexToStop) {
        setTimeout(() => loop(index + 1, indexToStop), 150);
      }
      image.src = `${baseUrl}/${images[index]}`;
    };
    loop(0, hour);
  }
};

if (document.readyState === "complete") {
  theSunRises();
} else {
  window.addEventListener("load", () => {
    theSunRises();
  });
}
