# House frames for the Daily Frame wall

Frames made by Keyframe for each brief, so the wall is never empty. They sit on the wall next to real posts.

- One folder per brief, named by its position in js/briefs.js: `1` is the first brief, `2` the second, and so on.
- Put the images in that folder, then list them in `manifest.json` like this:

```
{
  "1": [
    { "f": "01.jpg", "t": "01t.jpg", "w": 1600, "h": 900, "model": "Seedream 5 Pro",
      "slate": { "s": 0, "act": 2, "l": 3, "env": 0, "a": 1, "lens": 4, "t": 1, "em": 0, "e": 1 } }
  ]
}
```

- `f` is the file name, `w` and `h` its size in pixels, `model` what made it.
- `t` is optional: a smaller copy of the same image for the wall itself. Without it the wall uses `f`.
- `slate` is optional: the SLATE sheet shown when someone opens the frame. Each number is the position of the option in js/options.js, counting from 0. Leave a letter out to show it as "left to the model". For words of your own instead of a list option, add `"own": { "s": "...", "l": "", "a": "", "t": "", "e": "" }` and fill the letters you want. Keep all five letters in `own`, empty or not.
- The first three frames show from midnight. The rest appear one by one through the day, in a different order each day.

The frames for briefs 1 to 20 were built by `tools/wall/build-seed.cjs` from `tools/wall/frames.json`, which holds each frame's prompt and sheet. To add or replace frames, put the new images in a folder, named by frame id (`1.01.jpg`, `14.07.png` and so on), and run:

```
cd tools/wall && npm install sharp && cd ../..
node tools/wall/build-seed.cjs path/to/the/folder
```

It writes the two copies of each image and rewrites `manifest.json`.
