"""Adapta somente os cabeçalhos do PDF da Aula 02; preserva o original.

Uso: python scripts/academy/adapt-checklist-material.py documento.pdf
As imagens são renderizações completas do PDF adaptado, na resolução nativa.
"""
from pathlib import Path
import hashlib
import json
import shutil
import sys
import fitz
from PIL import Image, ImageChops, ImageDraw

out = Path('academy-materials/aula-02')
out.mkdir(parents=True, exist_ok=True)
original = out / 'original.pdf'
source = Path(sys.argv[1])
assert hashlib.sha256(source.read_bytes()).hexdigest() == '1ef65233b118f5cb0e9df54e9c728e2279c362346444580f4c4abffcef028274', 'Arquivo diferente da referência conferida da Aula 02'
if source.resolve() != original.resolve():
    shutil.copyfile(source, original)
doc = fitz.open(original)
assert len(doc) == 4, 'Esperadas quatro páginas'
# Apenas o interior do selo da capa e BÔNUS 06 nos cabeçalhos superiores.
# Coordenadas em pontos PDF; títulos, separadores, logotipos e rodapés ficam fora.
regions = [(295, 87, 483, 128), (484, 12, 566, 33),
           (522, 12, 591, 32), (526, 12, 595, 33)]
manifest = {
    'source': 'Ponto do Motor', 'pageCount': 4,
    'authorization': 'O responsável pela EDSON OFICINA confirmou neste atendimento que possui autorização do titular para reproduzir, adaptar e publicar também o PDF da Aula 02. Registro da declaração do responsável; não representa verificação independente de contrato.',
    'originalSha256': hashlib.sha256(original.read_bytes()).hexdigest(),
    'adaptation': 'BÔNUS 06 substituído por AULA 02 somente nos quatro cabeçalhos superiores. Autoria, corpo, fotografias, legendas, avisos e referências de rodapé preservados.',
    'pages': [],
}
for i, page in enumerate(doc):
    assert tuple(page.rect) == (0, 0, 768, 1152)
    before = page.get_pixmap(matrix=fitz.Matrix(4/3, 4/3), alpha=False)
    rect = fitz.Rect(regions[i])
    color = tuple(v/255 for v in before.pixel(int((rect.x0+1)*4/3), int((rect.y0+1)*4/3)))
    page.draw_rect(rect, color=color, fill=color, width=0, overlay=True)
    size = 26 if i == 0 else 12
    font = fitz.Font('hebo')
    width = fitz.get_text_length('AULA 02', fontname='hebo', fontsize=size)
    height = (font.ascender-font.descender)*size
    assert width < rect.width and height < rect.height
    baseline = rect.y0 + (rect.height-height)/2 + font.ascender*size
    page.insert_text((rect.x0+(rect.width-width)/2, baseline), 'AULA 02', fontsize=size,
                     fontname='hebo', color=(.03,.04,.04) if i==0 else (.97,.97,.97), overlay=True)
    after = page.get_pixmap(matrix=fitz.Matrix(4/3, 4/3), alpha=False)
    a = Image.frombytes('RGB', (before.width, before.height), before.samples)
    b = Image.frombytes('RGB', (after.width, after.height), after.samples)
    check = ImageChops.difference(a, b)
    ImageDraw.Draw(check).rectangle((int(rect.x0*4/3)-2, int(rect.y0*4/3)-2,
                                    int(rect.x1*4/3)+2, int(rect.y1*4/3)+2), fill=(0, 0, 0))
    assert not check.getbbox(), f'Alteração fora do cabeçalho na página {i+1}'
    filename = f'pagina-{i+1:02}.png'
    after.save(out / filename)
    manifest['pages'].append({'page': i+1, 'file': filename, 'width': after.width,
                             'height': after.height, 'editedHeaderRect': list(regions[i]),
                             'identicalOutsideHeader': True,
                             'sha256': hashlib.sha256((out/filename).read_bytes()).hexdigest()})
doc.set_metadata({'title': 'AULA 02 — CONFERÊNCIA FINAL ANTES DE DAR PARTIDA',
                  'author': 'Ponto do Motor — adaptação educacional EDSON OFICINA Academy',
                  'subject': 'Quatro páginas integrais. Somente cabeçalhos superiores adaptados.'})
adapted = out / 'Aula_02_Conferencia_Final_sem_Bonus_no_Cabecalho.pdf'
doc.save(adapted, garbage=4, deflate=True)
manifest['adaptedFile'] = adapted.name
manifest['adaptedSha256'] = hashlib.sha256(adapted.read_bytes()).hexdigest()
(out/'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
print('Quatro páginas completas; pixels externos aos cabeçalhos idênticos.')
