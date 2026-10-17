// Converts source images in assets/photos/ into web-ready WebP in assets/img/.
// To swap a photo, replace the source file and re-run `npm run images`.
import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// A plain filename comes from assets/photos; a path with a slash is relative to the project root.
const src = (f) => (f.includes('/') ? resolve(root, f) : resolve(root, 'assets/photos', f));
const out = (f) => resolve(root, 'assets/img', f);

// width = display width x2, for sharpness on high-density screens. Never upscales.
const JOBS = [
  // Photography
  { from: 'client_photo3.jpg', to: 'client-chair.webp', width: 736, q: 80 },
  { from: 'barber_photo2.jpg', to: 'barber-station.webp', width: 736, q: 80 },
  { from: 'mobilebarber1.jpg', to: 'mobile-barber.webp', width: 736, q: 80 },
  { from: 'craft1.jpg', to: 'craft-1.webp', width: 524, q: 80 },
  { from: 'craft2.jpg', to: 'craft-2.webp', width: 736, q: 80 },
  { from: 'craft3.jpg', to: 'craft-3.webp', width: 736, q: 80 },
  { from: 'barber_photo1.jpg', to: 'craft-4.webp', width: 736, q: 80 },

  // App screenshots
  { from: 'discover_photo.PNG', to: 'screen-discover.webp', width: 640, q: 82 },
  { from: 'choose_photo.PNG', to: 'screen-choose.webp', width: 640, q: 82 },
  { from: 'pick_time_photo.PNG', to: 'screen-time.webp', width: 640, q: 82 },
  { from: 'confirm_photo.PNG', to: 'screen-confirm.webp', width: 640, q: 82 },
  { from: 'booking_calendar_photo.PNG', to: 'screen-calendar.webp', width: 640, q: 82 },
  { from: 'staff_mgt_photo.PNG', to: 'screen-staff.webp', width: 640, q: 82 },
  { from: 'performance_photo.PNG', to: 'screen-performance.webp', width: 640, q: 82 },

  // Features section. crop values are fractions of the source image.
  { from: 'assets/img/trimova-client-features.png', to: 'client-features.webp', width: 1800, q: 86 },
  { from: 'assets/img/trimova-client-features.png', to: 'client-features-phones.webp', width: 860, q: 86,
    crop: { left: 0.265, top: 0.15, width: 0.465, height: 0.56 } },
  { from: 'assets/img/trimova-barber-features.png', to: 'barber-features.webp', width: 1800, q: 86 },
];

await mkdir(out('.'), { recursive: true });

let beforeTotal = 0;
let afterTotal = 0;

for (const job of JOBS) {
  try {
    const before = (await stat(src(job.from))).size;
    let pipeline = sharp(src(job.from));
    if (job.crop) {
      const m = await sharp(src(job.from)).metadata();
      pipeline = pipeline.extract({
        left: Math.round(job.crop.left * m.width),
        top: Math.round(job.crop.top * m.height),
        width: Math.round(job.crop.width * m.width),
        height: Math.round(job.crop.height * m.height),
      });
    }
    const info = await pipeline
      .resize({ width: job.width, withoutEnlargement: true })
      .webp({ quality: job.q })
      .toFile(out(job.to));
    const after = (await stat(out(job.to))).size;
    beforeTotal += before;
    afterTotal += after;
    const pct = Math.round((1 - after / before) * 100);
    console.log(
      `${job.to.padEnd(26)} ${info.width}x${info.height}`.padEnd(48) +
        `${(before / 1024).toFixed(0).padStart(5)}KB -> ${(after / 1024).toFixed(0).padStart(4)}KB  (-${pct}%)`
    );
  } catch (err) {
    console.error(`FAILED ${job.from}: ${err.message}`);
  }
}

console.log(
  `\nTotal ${(beforeTotal / 1024 / 1024).toFixed(2)}MB -> ${(afterTotal / 1024 / 1024).toFixed(2)}MB ` +
    `(-${Math.round((1 - afterTotal / beforeTotal) * 100)}%)`
);
