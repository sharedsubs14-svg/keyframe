// SLATE vocabulary. Standard set and cinematography terms.
// Every option also carries what the blueprint needs to redraw itself.
window.SLATE_OPTIONS = {
  subjects: [
    { name: 'A lone figure', hint: 'one body, all the attention', kind: 'person' },
    { name: 'Two people', hint: 'a relationship in one frame', kind: 'two' },
    { name: 'A crowd, one in focus', hint: 'many bodies, one story', kind: 'crowd' },
    { name: 'A product on a surface', hint: 'the object is the hero', kind: 'product' },
    { name: 'A vehicle', hint: 'speed, weight, direction', kind: 'vehicle' },
    { name: 'An animal', hint: 'instinct, not performance', kind: 'animal' },
    { name: 'A street vendor', hint: 'work, hands, routine', kind: 'vendor' },
    { name: 'A child', hint: 'scale and wonder', kind: 'child' }
  ],
  actions: [
    { name: 'walking toward camera', hint: 'the approach' },
    { name: 'standing still, looking off frame', hint: 'waiting for something' },
    { name: 'turning to look back', hint: 'the glance' },
    { name: 'sitting, hands busy', hint: 'routine' },
    { name: 'running', hint: 'urgency' },
    { name: 'holding something up to the light', hint: 'inspection' },
    { name: 'caught mid-laugh', hint: 'release' },
    { name: 'leaning against a wall', hint: 'ease' }
  ],
  lights: [
    { name: 'Rembrandt', hint: '45° key on one side, a small triangle of light on the far cheek', x: 230, y: 118, r: 40, tone: 'white', shade: 0.55, lab: 'KEY · 45° L · HARD' },
    { name: 'Butterfly', hint: 'front and high, a small shadow under the nose', x: 400, y: 70, r: 44, tone: 'white', shade: 0.08, lab: 'KEY · FRONT HIGH' },
    { name: 'Split', hint: 'hard 90° side light, half the face in darkness', x: 110, y: 226, r: 30, tone: 'white', shade: 1.0, lab: 'KEY · 90° L · HARD' },
    { name: 'Backlit rim', hint: 'from behind, a bright edge around the body', x: 590, y: 96, r: 46, tone: 'warm', shade: 0.85, lab: 'RIM · BEHIND R' },
    { name: 'Soft window', hint: 'large source, wraps around, gentle falloff', x: 660, y: 166, r: 70, tone: 'warm', shade: 0.35, lab: 'WINDOW · SOFT R' },
    { name: 'Low-key single source', hint: 'one dim source, deep blacks', x: 214, y: 296, r: 28, tone: 'dim', shade: 0.8, lab: 'KEY · LOW L · DIM' },
    { name: 'High-key even', hint: 'bright and flat, almost no shadow', x: 400, y: 60, r: 90, tone: 'white', shade: 0.0, lab: 'KEY + FILL · EVEN' },
    { name: 'Practical neon', hint: 'a coloured light source inside the frame', x: 690, y: 214, r: 50, tone: 'neon', shade: 0.6, lab: 'PRACTICAL · NEON R' },
    { name: 'Top light', hint: 'straight down, the eyes fall into shadow', x: 400, y: 46, r: 36, tone: 'white', shade: 0.3, lab: 'KEY · TOP' }
  ],
  environments: [
    { name: 'Rain-slick city street', hint: 'reflections everywhere' },
    { name: 'Empty studio, seamless backdrop', hint: 'nothing but the subject' },
    { name: 'Interior, one window', hint: 'domestic, quiet' },
    { name: 'Open field, horizon visible', hint: 'scale' },
    { name: 'Rooftop at the edge', hint: 'height and sky' },
    { name: 'Narrow alley', hint: 'walls close in' },
    { name: 'Old market, cluttered', hint: 'texture and life' },
    { name: 'Highway at speed', hint: 'blur and lines' }
  ],
  angles: [
    { name: 'Eye level', hint: 'neutral, how we meet people', cx: 160, cy: 300, tilt: 0, lab: 'CAM · EYE LEVEL', ots: false },
    { name: 'Low angle', hint: 'power and scale, how heroes are shot', cx: 160, cy: 420, tilt: 0, lab: 'CAM · LOW', ots: false },
    { name: 'High angle', hint: 'small, vulnerable', cx: 160, cy: 140, tilt: 0, lab: 'CAM · HIGH', ots: false },
    { name: 'Overhead', hint: 'top-down, pattern over people', cx: 400, cy: 34, tilt: 0, lab: 'CAM · OVERHEAD', ots: false },
    { name: 'Dutch tilt', hint: 'something is off', cx: 160, cy: 300, tilt: 12, lab: 'CAM · DUTCH 12°', ots: false },
    { name: 'Over the shoulder', hint: 'two bodies, one watching', cx: 120, cy: 330, tilt: 0, lab: 'CAM · OVER SHOULDER', ots: true }
  ],
  lenses: [
    { name: '24mm wide', hint: 'stretched space, faces distort near the edge', fw: 600, fh: 338, fov: '74° HFOV' },
    { name: '35mm', hint: 'street, honest, a little heroic', fw: 480, fh: 270, fov: '54° HFOV' },
    { name: '50mm', hint: 'roughly what the eye sees', fw: 380, fh: 214, fov: '40° HFOV' },
    { name: '85mm portrait', hint: 'flattering, the background melts', fw: 260, fh: 146, fov: '24° HFOV' },
    { name: '135mm telephoto', hint: 'compressed, distant, watching', fw: 190, fh: 107, fov: '15° HFOV' },
    { name: '40mm anamorphic', hint: 'wide scope frame, oval bokeh, streak flares', fw: 580, fh: 243, fov: '2.39 : 1' }
  ],
  times: [
    { name: 'Dawn', hint: 'cool going warm, long soft shadows', top: '#2B1D52', bot: '#E0896A', sx: 110, sy: 236, sr: 13, sc: '#F4B183', lab: 'SUN · DAWN' },
    { name: 'Golden hour', hint: 'low warm sun, long shadows', top: '#4A2238', bot: '#F0A355', sx: 680, sy: 226, sr: 15, sc: '#F2C14E', lab: 'SUN · GOLDEN HOUR' },
    { name: 'High noon', hint: 'hard light from above, short shadows', top: '#3A6AB0', bot: '#A8CCF0', sx: 560, sy: 66, sr: 13, sc: '#FFE9A8', lab: 'SUN · NOON' },
    { name: 'Overcast', hint: 'soft and flat, no hard shadows', top: '#5A5A68', bot: '#9A9CA8', sx: 250, sy: 110, sr: 44, sc: '#B8B8C4', lab: 'OVERCAST' },
    { name: 'Blue hour', hint: 'just after sunset, the sky still holds colour', top: '#141C52', bot: '#4A55A8', sx: 650, sy: 244, sr: 11, sc: '#C4B5FD', lab: 'SUN · −6° · BLUE HOUR' },
    { name: 'Night', hint: 'practical lights carry the frame', top: '#05061A', bot: '#1C2150', sx: 570, sy: 80, sr: 10, sc: '#E8E6F0', lab: 'MOON · NIGHT' }
  ],
  emotions: [
    { name: 'Longing', hint: 'wanting what is out of frame' },
    { name: 'Tension', hint: 'something is about to happen' },
    { name: 'Awe', hint: 'small in front of something big' },
    { name: 'Melancholy', hint: 'quiet sadness, no drama' },
    { name: 'Joy', hint: 'unguarded' },
    { name: 'Dread', hint: 'what is behind the door' },
    { name: 'Calm', hint: 'nothing needs to happen' },
    { name: 'Defiance', hint: 'looking straight at us' }
  ],
  genres: [
    { name: 'Film noir', hint: 'shadow, smoke, wet streets', c: '#0E1222', o: 0.3 },
    { name: 'Romance', hint: 'warm, soft, skin tones first', c: '#E07A9A', o: 0.12 },
    { name: 'Thriller', hint: 'teal, tight, cold', c: '#0E6E6A', o: 0.18 },
    { name: 'Sci-fi', hint: 'cyan, clean, hard surfaces', c: '#22D3EE', o: 0.12 },
    { name: 'Western', hint: 'amber, dust, wide open', c: '#D98B2B', o: 0.16 },
    { name: 'Documentary', hint: 'as it is, no grade', c: '#000000', o: 0 },
    { name: 'Horror', hint: 'desaturated, green-black', c: '#0B2A1C', o: 0.26 },
    { name: 'Commercial', hint: 'clean, bright, product-true colour', c: '#FFFFFF', o: 0.05 }
  ],
  advanced: {
    expression: ['neutral, unreadable', 'half smile', 'eyes closed', 'mid-sentence', 'looking straight into lens', 'looking just past lens'],
    composition: ['rule of thirds, subject left', 'dead centre, symmetrical', 'leading lines to subject', 'negative space above', 'frame within a frame', 'tight headroom'],
    props: ['an umbrella', 'a cigarette', 'a phone screen glowing', 'a cup of chai', 'a camera', 'a suitcase'],
    wardrobe: ['plain dark clothing', 'a red coat', 'white shirt, sleeves rolled', 'traditional dress', 'work uniform'],
    aperture: ['f/1.4, paper-thin focus', 'f/2.8, subject sharp, background soft', 'f/5.6, most of it sharp', 'f/11, deep focus'],
    shutter: ['frozen, no motion blur', 'slight motion blur on hands', 'long exposure, light trails', 'panning blur on background'],
    'ISO / grain': ['clean digital', 'fine 35mm grain', 'heavy 16mm grain', 'ISO 3200 noise, visible'],
    palette: ['teal and orange', 'monochrome', 'muted earth tones', 'one colour accent on grey', 'pastel', 'high saturation']
  },
  models: [
    { id: 'gpt', name: 'GPT Image 2' },
    { id: 'banana', name: 'Nano Banana 2.1' },
    { id: 'seedream', name: 'Seedream 5 Pro' },
    { id: 'mj', name: 'Midjourney' },
    { id: 'universal', name: 'Universal' }
  ],
  // What the model picks on its own. This is "Random": the default, the slop.
  defaults: { l: 6, a: 0, lens: 2, t: 2, e: 5 },
  // Coherent sets keyed by genre index. Auto-complete fills blanks from these, around what the user chose.
  coherent: {
    0: { l: 0, env: 0, a: 1, lens: 1, t: 4, em: 0 },
    1: { l: 4, env: 2, a: 0, lens: 3, t: 1, em: 4 },
    2: { l: 2, env: 5, a: 4, lens: 1, t: 5, em: 1 },
    3: { l: 7, env: 7, a: 1, lens: 0, t: 5, em: 2 },
    4: { l: 3, env: 3, a: 1, lens: 5, t: 1, em: 7 },
    5: { l: 4, env: 6, a: 0, lens: 2, t: 3, em: 6 },
    6: { l: 8, env: 5, a: 2, lens: 0, t: 5, em: 5 },
    7: { l: 6, env: 1, a: 0, lens: 3, t: 2, em: 4 }
  }
};
