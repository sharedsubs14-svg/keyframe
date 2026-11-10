#!/usr/bin/env node
/* Builds the house frames for the Daily Frame wall.

   Takes a folder of generated images and writes, for every image it can match to a frame in frames.json:
     seed/<brief>/<NN>.jpg    the full frame, longest side 1600px
     seed/<brief>/<NN>t.jpg   the small copy the wall shows, longest side 640px
   and then rewrites seed/manifest.json from what is actually in the seed folder.

   Usage:   node tools/wall/build-seed.cjs <folder-of-images>
   Needs:   npm install sharp   (run it inside tools/wall, once)

   A file is matched to a frame by its name: either the frame id (1.01, 14.07 ...) or the
   Magnific creation identifier recorded for that frame in frames.json. */
const fs = require('fs'), path = require('path');
let sharp; try { sharp = require('sharp'); } catch (e) { console.error('sharp is missing. Run: cd tools/wall && npm install sharp'); process.exit(1); }

const ROOT = path.resolve(__dirname, '..', '..'), SEED = path.join(ROOT, 'seed');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'frames.json'), 'utf8'));
const frames = data.frames, byId = new Map(frames.map(f => [f.id, f]));
const src = process.argv[2];
const pad = (n) => String(n).padStart(2, '0');

function match(name) {
  const base = name.replace(/\.[a-z0-9]+$/i, '');
  const m = base.match(/(?:^|[^0-9])(\d{1,2}\.\d{2})(?![0-9])/);
  if (m && byId.has(m[1])) return byId.get(m[1]);
  return frames.find(f => f.magnific && base.includes(f.magnific)) || null;
}
function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]); }

(async () => {
  if (src) {
    const files = walk(src).filter(f => /\.(png|jpe?g|webp)$/i.test(f) && !path.basename(f).startsWith('.'));
    const seen = new Set(), unmatched = [], dupes = [];
    for (const file of files) {
      const f = match(path.basename(file));
      if (!f) { unmatched.push(path.basename(file)); continue; }
      if (seen.has(f.id)) { dupes.push(path.basename(file)); continue; }
      seen.add(f.id);
      const dir = path.join(SEED, String(f.brief)); fs.mkdirSync(dir, { recursive: true });
      const img = sharp(file, { failOn: 'none' }).rotate();
      await img.clone().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(dir, pad(f.n) + '.jpg'));
      await img.clone().resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(dir, pad(f.n) + 't.jpg'));
    }
    console.log(`matched ${seen.size} of ${files.length} files`);
    if (unmatched.length) console.log('not matched to any frame:', unmatched.join(', '));
    if (dupes.length) console.log('skipped, frame already had an image:', dupes.join(', '));
  }
  // The manifest is rebuilt from the seed folder itself, so it never lists a frame that has no image.
  const manifest = {}; let total = 0, bytes = 0; const missing = [];
  for (const f of frames) {
    const full = path.join(SEED, String(f.brief), pad(f.n) + '.jpg'), tile = path.join(SEED, String(f.brief), pad(f.n) + 't.jpg');
    if (!fs.existsSync(full)) { missing.push(f.id); continue; }
    const meta = await sharp(full).metadata();
    const entry = { f: pad(f.n) + '.jpg', w: meta.width, h: meta.height, model: 'Seedream 5 Pro', slate: f.slate };
    if (fs.existsSync(tile)) { entry.t = pad(f.n) + 't.jpg'; bytes += fs.statSync(tile).size; }
    bytes += fs.statSync(full).size; total++;
    (manifest[f.brief] = manifest[f.brief] || []).push(entry);
  }
  fs.writeFileSync(path.join(SEED, 'manifest.json'), JSON.stringify(manifest) + '\n');
  console.log(`manifest: ${total} frames across ${Object.keys(manifest).length} briefs, ${(bytes / 1e6).toFixed(1)} MB of images`);
  if (missing.length) console.log(`${missing.length} frames have no image yet:`, missing.length > 40 ? missing.slice(0, 40).join(' ') + ' ...' : missing.join(' '));
})().catch(e => { console.error(e); process.exit(1); });
