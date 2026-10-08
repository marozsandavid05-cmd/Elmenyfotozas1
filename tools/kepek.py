# Weboldal 2 (Posztó) képei az ügyfél-anyagból. Egy forrásfájl = egy kulcs = egy hely az oldalon.
# Futtatás a weboldal 2 mappából:  python tools/kepek.py   (Pillow kell)
# Kimenet: media/<kulcs>-<szélesség>.webp és media/kepek.json (méretek a buildnek).
import os, json
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', '..', 'ugyfel-anyag', 'kepek')
OUT = os.path.join(HERE, '..', 'media')

K = {
  # FŐOLDAL · nyomat-asztal (hero)
  'h-kalap': 'Selfiebox-galeria-01.webp',
  'h-csapat': 'Pixie-rendezvenyen-09.webp',
  'h-lufi': 'Pixie-a-Nobu-etteremben-03.webp',
  'h-kellek': '029-rendezvenyfotozas-elmenyfotozas-hu.webp',
  'h-eskuvo': 'Selfiebox-galeria-07.webp',
  'h-fiu': 'Pixie-rendezvenyen-08.webp',
  # FŐOLDAL · eszköz-index előnézetei, este, zárás
  'i-pixie': 'Pixie-2000x2000-1.webp',
  'i-ai': 'AI-PRO-1-1.webp',
  'i-box': 'Selfiebox-galeria-03.webp',
  'i-foto': '043-rendezvenyfotozas-elmenyfotozas-hu.webp',
  'i-gala': '031-rendezvenyfotozas-elmenyfotozas-hu.webp',
  # PIXIE
  'x-nobu-1': 'Pixie-a-Nobu-etteremben-01.webp',
  'x-nobu-2': 'Pixie-a-Nobu-etteremben-02.webp',
  'x-nobu-4': 'Pixie-a-Nobu-etteremben-04.webp',
  'x-nobu-5': 'Pixie-a-Nobu-etteremben-05.webp',
  'x-nobu-6': 'Pixie-a-Nobu-etteremben-06.webp',
  'x-nobu-7': 'Pixie-a-Nobu-etteremben-07.webp',
  'x-lany': 'Pixie-rendezvenyen-01.webp',
  'x-csapat': 'Pixie-rendezvenyen-10.webp',
  'x-kint-1': 'Pixie-rendezvenyen-03.webp',
  'x-kint-2': 'Pixie-rendezvenyen-07.webp',
  'x-video': 'Pixie-1920_780.webp',
  'x-studio': 'Pixie-1500x2000-1.webp',
  # AI SELFIE
  'a-allvany': 'AI-PRO-02.webp',
  'a-hos': 'ai-selfie-pro-01.webp',
  'a-vampir': 'ai-selfie-pro-02.webp',
  'a-szeles': 'AI-PRO-02-FHD.webp',
  # SELFIEBOX
  's-rozsa': 'Selfiebox-galeria-02.webp',
  's-szeles': 'Selfiebox-1920x780-1.webp',
  's-maszk': 'Selfiebox-galeria-06.webp',
  's-ketten': 'Selfiebox-galeria-04.webp',
  's-erintes': 'Selfiebox-galeria-14.webp',
  's-szamlalo': 'Selfiebox-galeria-13.webp',
  's-kollazs': 'Selfiebox-galeria-09.webp',
  's-kezben': 'Selfiebox-galeria-08.webp',
  's-harom': 'SelfieBoxok.webp',
  's-k1': 'Selfiebox-galeria-10.webp',
  's-k2': 'Selfiebox-galeria-12.webp',
  's-k3': 'Selfiebox-galeria-11.webp',
  's-k4': 'Selfiebox-galeria-05.webp',
  # RENDEZVÉNYFOTÓZÁS
  'r-fust': '007-rendezvenyfotozas-elmenyfotozas-hu.webp',
  'r-mc': '004-rendezvenyfotozas-elmenyfotozas-hu.webp',
  'r-zenekar': '005-rendezvenyfotozas-elmenyfotozas-hu.webp',
  'r-feher': '006-rendezvenyfotozas-elmenyfotozas-hu.webp',
  'r-terem': '008-rendezvenyfotozas-elmenyfotozas-hu.webp',
  'r-tuz': '009-rendezvenyfotozas-elmenyfotozas-hu.webp',
  'r-regatta': '012-rendezvenyfotozas-elmenyfotozas-hu.webp',
  'r-spi': '040-rendezvenyfotozas-elmenyfotozas-hu.webp',
  'r-sushi': '021-rendezvenyfotozas-elmenyfotozas-hu.webp',
  'r-fozes': '038-rendezvenyfotozas-elmenyfotozas-hu.webp',
  'r-napszemuveg': '027-rendezvenyfotozas-elmenyfotozas-hu.webp',
  'r-kifuto': '032-rendezvenyfotozas-elmenyfotozas-hu.webp',
  'r-palota': '033-rendezvenyfotozas-elmenyfotozas-hu.webp',
  'r-panel': '035-rendezvenyfotozas-elmenyfotozas-hu.webp',
  'r-birkozo': '024-rendezvenyfotozas-elmenyfotozas-hu.webp',
  'r-uszoda': '028-rendezvenyfotozas-elmenyfotozas-hu.webp',
  'r-sup': '016-rendezvenyfotozas-elmenyfotozas-hu.webp',
  'r-tomeg': '026-rendezvenyfotozas-elmenyfotozas-hu.webp',
  'r-jelmez': '002-rendezvenyfotozas-elmenyfotozas-hu.webp',
  # TUDNIVALÓK, KÖSZÖNJÜK, 404
  't-pixie': 'Pixie-9-16.webp',
  'k-par': '019-rendezvenyfotozas-elmenyfotozas-hu.webp',
  'e-bohoc': '037-rendezvenyfotozas-elmenyfotozas-hu.webp',
}
for i in range(1, 13):
    K[f'hatter-{i:02d}'] = f'{i:02d}-Elmenyfotozas-Hatterek.webp'

os.makedirs(OUT, exist_ok=True)
meta, seen = {}, set()
for nev, f in K.items():
    assert f not in seen, f'duplikált forrás: {f}'
    seen.add(f)
    im = Image.open(os.path.join(SRC, f)).convert('RGB')
    w, h = im.size
    meta[nev] = {'w': w, 'h': h, 'src': f}
    if nev.startswith('hatter'):
        widths = [800, 400]
    elif w > 1100:
        widths = [1600, 800]
    else:
        widths = [w] if w <= 900 else [w, 700]
    outs = []
    for tw in widths:
        tw = min(tw, w)
        th = round(h * tw / w)
        r = im.resize((tw, th), Image.LANCZOS) if tw != w else im
        fn = f'{nev}-{tw}.webp'
        r.save(os.path.join(OUT, fn), 'WEBP', quality=80 if tw > 900 else 78, method=6)
        outs.append([fn, tw, th])
    meta[nev]['out'] = outs
json.dump(meta, open(os.path.join(OUT, 'kepek.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
tot = sum(os.path.getsize(os.path.join(OUT, x)) for x in os.listdir(OUT) if x.endswith('.webp'))
print(len(K), 'kép,', round(tot / 1024 / 1024, 1), 'MB')
