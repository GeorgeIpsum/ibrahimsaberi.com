// Rasterize parametric silhouettes into Unicode braille (2x4 dots / cell).
// Prints a high-res ASCII preview + the braille so the shapes can be eyeballed.

const BLANK = 0x2800; // braille pattern blank (matches existing art bg)

// dot bit by (dx in {0,1}, dy in {0,1,2,3}) per Unicode braille layout.
const DOT = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
];

// W,H in cells -> 2W x 4H subpixels. sample(nx,ny) with nx,ny in [-1,1].
function raster(W, H, sample) {
  const sw = 2 * W;
  const sh = 4 * H;
  const on = (sx, sy) => {
    const nx = ((sx + 0.5) / sw) * 2 - 1;
    const ny = ((sy + 0.5) / sh) * 2 - 1;
    return sample(nx, ny);
  };
  const braille = [];
  const preview = [];
  for (let cy = 0; cy < H; cy++) {
    let bl = "";
    for (let cx = 0; cx < W; cx++) {
      let bits = 0;
      for (let dy = 0; dy < 4; dy++)
        for (let dx = 0; dx < 2; dx++)
          if (on(cx * 2 + dx, cy * 4 + dy)) bits |= DOT[dy][dx];
      bl += String.fromCodePoint(BLANK + bits);
    }
    braille.push(bl);
  }
  for (let sy = 0; sy < sh; sy++) {
    let pl = "";
    for (let sx = 0; sx < sw; sx++) pl += on(sx, sy) ? "#" : " ";
    preview.push(pl);
  }
  return { braille: braille.join("\n"), preview: preview.join("\n"), W, H };
}

const inCircle = (x, y, cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;

function pointInPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

// ---- shapes -------------------------------------------------------------

const heart = (nx, ny) => {
  const x = nx * 1.25;
  const y = -ny * 1.25 + 0.35;
  const a = x * x + y * y - 1;
  return a * a * a - x * x * y * y * y <= 0;
};

const star = (() => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? 0.98 : 0.42;
    pts.push([Math.cos(ang) * r, Math.sin(ang) * r]);
  }
  return (nx, ny) => pointInPoly(nx, ny, pts);
})();

const moon = (nx, ny) =>
  inCircle(nx, ny, -0.15, 0, 0.95) && !inCircle(nx, ny, 0.45, -0.12, 0.92);

const sun = (nx, ny) => {
  const r = Math.hypot(nx, ny);
  if (r <= 0.42) return true; // core
  const a = Math.atan2(ny, nx);
  const tri = Math.abs((((a * 10) / (2 * Math.PI)) % 1) + 1) % 1; // 0..1 per ray
  const spike = Math.abs(tri - 0.5) * 2; // 1 at ray center
  return r < 0.5 + 0.45 * spike && r < 0.95;
};

const wave = (nx, ny) => {
  for (const [off, amp, fr, ph, th] of [
    [-0.45, 0.18, 3.0, 0.0, 0.1],
    [0.05, 0.2, 2.6, 1.3, 0.11],
    [0.55, 0.16, 3.3, 2.4, 0.1],
  ]) {
    if (Math.abs(ny - (off + amp * Math.sin(fr * Math.PI * nx + ph))) < th)
      return true;
  }
  return false;
};

const bubble = (nx, ny) => {
  // rounded-rect outline + a little tail + three dots
  const bx = 0.82;
  const by = 0.5;
  const rad = 0.28;
  const inRounded = (x, y, t) => {
    const ax = Math.abs(x);
    const ay = Math.abs(y);
    const cx = bx - rad;
    const cy = by - rad;
    let d;
    if (ax <= cx) d = by - ay;
    else if (ay <= cy) d = bx - ax;
    else d = rad - Math.hypot(ax - cx, ay - cy);
    return d >= 0 && d <= t;
  };
  const outline = inRounded(nx, ny + 0.12, 0.085);
  const tail =
    pointInPoly(nx, ny, [
      [-0.18, 0.34],
      [-0.46, 0.86],
      [-0.02, 0.4],
    ]) && !inCircle(nx, ny + 0.12, 0, 0, 0.0);
  const dots =
    inCircle(nx, ny + 0.1, -0.32, 0, 0.07) ||
    inCircle(nx, ny + 0.1, 0, 0, 0.07) ||
    inCircle(nx, ny + 0.1, 0.32, 0, 0.07);
  return outline || tail || dots;
};

// ---- render -------------------------------------------------------------

const jobs = [
  ["heart", 24, 12, heart],
  ["star", 24, 12, star],
  ["moon", 24, 12, moon],
  ["sun", 26, 13, sun],
  ["wave", 40, 8, wave],
  ["bubble", 30, 12, bubble],
];

for (const [name, W, H, fn] of jobs) {
  const { braille, preview } = raster(W, H, fn);
  console.log(`\n===== ${name} (${W}x${H}) =====`);
  console.log(preview);
  console.log("--- braille ---");
  console.log(braille);
}
