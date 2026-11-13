"""Adapta somente cabeçalhos do PDF; requer PyMuPDF e Pillow no ambiente editorial.
Uso: python scripts/academy/adapt-material.py documento.pdf
Não integra o runtime/build. Preserva original e compara pixels fora das áreas editadas.
"""
from pathlib import Path
import sys, json, hashlib, shutil
import fitz
from PIL import Image, ImageChops, ImageDraw
out = Path('academy-materials/aula-01')
out.mkdir(parents=True, exist_ok=True)
source = Path(sys.argv[1])
original = out / 'original.pdf'
if source.resolve() != original.resolve(): shutil.copyfile(source, original)
doc = fitz.open(original)
assert len(doc) == 11, 'Esperadas 11 páginas'
# Coordenadas do PDF (768 x 1152). Apenas selo e indicação de bônus dos cabeçalhos.
regions = [(269,85,500,141), (424,12,510,40), (510,12,596,37),
           (485,11,582,41), (494,10,588,42), (484,13,580,43),
           (430,10,516,40), (475,11,576,42), (459,10,567,43),
           (408,17,497,47), (490,10,587,42)]
manifest = {'source': 'Ponto do Motor', 'pageCount': 11, 'originalSha256': hashlib.sha256(original.read_bytes()).hexdigest(),
 'authorization': 'Titular do site confirmou no atendimento autorização para adaptar e publicar em 13/11/2026.',
 'adaptation': 'Somente o selo BÔNUS 03 da capa e a indicação BÔNUS 03 · dos cabeçalhos técnicos. Demais referências a bônus no corpo e rodapés preservadas.', 'pages': []}
for i, page in enumerate(doc):
    assert page.rect.width == 768 and page.rect.height == 1152
    before = page.get_pixmap(matrix=fitz.Matrix(4/3,4/3), alpha=False)
    rect = fitz.Rect(regions[i])
    # Sobreposição editorial no documento; não recorta nem substitui o conteúdo técnico.
    color = tuple(v / 255 for v in before.pixel(int((rect.x0+2)*4/3),int((rect.y0+2)*4/3)))
    if i == 0: color = (0.97, 0.78, 0.02)
    page.draw_rect(rect, color=color, fill=color, width=0, overlay=True)
    if i == 0:
        page.insert_textbox(rect + (0,8,0,0), 'AULA 01', fontsize=28, fontname='hebo', align=1, color=(0.03,0.04,0.04), overlay=True)
    after = page.get_pixmap(matrix=fitz.Matrix(4/3,4/3), alpha=False)
    a = Image.frombytes('RGB', (before.width,before.height), before.samples)
    b = Image.frombytes('RGB', (after.width,after.height), after.samples)
    delta = ImageChops.difference(a,b)
    # Permite 2 pixels de antialiasing na borda do retângulo de cabeçalho.
    check = delta.copy(); ImageDraw.Draw(check).rectangle((int(rect.x0*4/3)-2,int(rect.y0*4/3)-2,int(rect.x1*4/3)+2,int(rect.y1*4/3)+2), fill=(0,0,0))
    assert not check.getbbox(), f'Alteração fora do cabeçalho na página {i+1}'
    filename = f'page-{i+1:02}.png'
    after.save(out / filename)
    manifest['pages'].append({'page':i+1,'file':filename,'width':after.width,'height':after.height,
      'editedHeaderRect':list(regions[i]),'identicalOutsideHeader':True,'sha256':hashlib.sha256((out / filename).read_bytes()).hexdigest()})
doc.set_metadata({'title':'AULA 01 — MOTORES QUE BATEM VÁLVULA','author':'Ponto do Motor — adaptação educacional EDSON OFICINA Academy',
 'subject':'Tabelas, imagens, legendas e créditos preservados. Apenas cabeçalhos adaptados.'})
doc.save(out / 'aula-01.pdf', garbage=4, deflate=True)
manifest['adaptedSha256'] = hashlib.sha256((out/'aula-01.pdf').read_bytes()).hexdigest()
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('11 páginas preservadas; pixels externos aos cabeçalhos idênticos. Original SHA-256:',manifest['originalSha256'])
