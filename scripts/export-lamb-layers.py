"""Export the supplied layered lamb PSD; the PSD is never changed.
Requires psd-tools, Pillow and numpy. Usage: python export-lamb-layers.py SOURCE.psd
"""
from pathlib import Path
import json
import sys
import numpy as np
from PIL import Image
from psd_tools import PSDImage

source = Path(sys.argv[1])
output = Path(__file__).resolve().parents[1] / 'dist/assets/sheep/lamb'
output.mkdir(parents=True, exist_ok=True)
psd = PSDImage.open(source)
layers = {layer.name: layer.topil().convert('RGBA') for layer in psd if layer.name in ('body', 'Lag', 'head')}
assert set(layers) == {'body', 'Lag', 'head'}, 'Expected body, Lag and head layers'
bounds = [im.getchannel('A').getbbox() for im in layers.values()]
box = (min(b[0] for b in bounds), min(b[1] for b in bounds), max(b[2] for b in bounds), max(b[3] for b in bounds))
width = min(768, box[2] - box[0])
height = round((box[3] - box[1]) * width / (box[2] - box[0]))
sx, sy = width / (box[2] - box[0]), height / (box[3] - box[1])
def point(x, y):
    return [round((x - box[0]) * sx, 3), round((y - box[1]) * sy, 3)]
parts = []
def export(name, image, pivot):
    scaled = image.crop(box).resize((width, height), Image.Resampling.LANCZOS)
    rect = scaled.getchannel('A').getbbox()
    scaled.crop(rect).save(output / (name + '.png'), optimize=True)
    parts.append(dict(name=name, x=rect[0], y=rect[1], width=rect[2]-rect[0], height=rect[3]-rect[1], pivot=point(*pivot)))
export('body', layers['body'], (1600, 1000))
export('head', layers['head'], (1950, 900))
legs = layers['Lag']
alpha = np.asarray(legs)[:, :, 3]
xs = np.where((alpha > 32).any(axis=0))[0]
groups = [g for g in np.split(xs, np.where(np.diff(xs) > 1)[0] + 1) if len(g) > 4]
assert len(groups) == 4, 'Expected four separated legs in Lag'
cuts = [0] + [int((a[-1] + b[0]) / 2) for a, b in zip(groups, groups[1:])] + [psd.width]
for i, group in enumerate(groups):
    leg = Image.new('RGBA', psd.size)
    leg.paste(legs.crop((cuts[i], 0, cuts[i+1], psd.height)), (cuts[i], 0))
    export('leg' + str(i), leg, ((int(group[0])+int(group[-1]))/2, bounds[1][1]+20))
meta = dict(width=width, height=height, parts=parts, eyes=[point(1982, 1006), point(2123, 872)])
(output / 'lamb-sprite.js').write_text('export const LAMB_SPRITE = ' + json.dumps(meta, indent=2) + ';\n', encoding='utf-8')
print(json.dumps(meta))
