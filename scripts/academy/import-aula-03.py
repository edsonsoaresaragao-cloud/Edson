"""Importa a Aula 03 e divide o original em duas partes sem rasterizar páginas.

Uso: python scripts/academy/import-aula-03.py /caminho/original.pdf
Mantém revisões existentes; não gera nem aprova transcrições.
"""
import argparse
import importlib.util
import json
from pathlib import Path

import fitz

spec = importlib.util.spec_from_file_location('library_import', Path(__file__).with_name('import-library-material.py'))
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    args = parser.parse_args()
    root = Path('academy-materials/library/aula-03')
    root.mkdir(parents=True, exist_ok=True)
    with fitz.open(args.source) as source:
        assert len(source) == 187, 'A fonte deve conter exatamente 187 páginas.'
    digest = helper.immutable_copy(args.source, root / 'original.pdf')
    parts = []
    with fitz.open(root / 'original.pdf') as source:
        for index, (first, last) in enumerate(((1, 94), (95, 187)), 1):
            filename = f'parte-{index:02}.pdf'
            target = root / filename
            with fitz.open() as part:
                part.insert_pdf(source, from_page=first - 1, to_page=last - 1)
                part.set_metadata(source.metadata)
                data = part.tobytes(garbage=4, deflate=True, no_new_id=True)
            if not target.exists():
                target.write_bytes(data)
            with fitz.open(target) as part:
                assert len(part) == last - first + 1
                for offset in range(len(part)):
                    original = source[first - 1 + offset]
                    copied = part[offset]
                    assert original.rect == copied.rect
                    assert original.get_pixmap().samples == copied.get_pixmap().samples, f'Página alterada: {first + offset}'
            parts.append({'filename': filename, 'firstPage': first, 'lastPage': last,
                          'sha256': helper.sha256(target.read_bytes())})
        files = [helper.page_images(source, n, root) for n in range(1, 188)]
    manifest = {'courseNumber': 3, 'source': 'Ponto do Motor', 'sourceFile': '1793834496236-compress-guias-visuais-de-ponto-do-motor-3.pdf',
                'sourceUrl': 'https://drive.google.com/file/d/1xxF2H2M89McUnbC_FCKvuBOYbUM2vYZj/view',
                'expectedPageCount': 187, 'pageCount': 187, 'originalSha256': digest,
                'originalFile': 'original.pdf', 'authorization': helper.material_authorization(3),
                'adaptation': 'Cabeçalhos originais preservados.', 'pdfParts': parts, 'files': files,
                'splitVerification': {'pagesCompared': 187, 'identicalToOriginalRender': True}}
    helper.write_json(root / 'manifest.json', manifest)
    editorial = Path('src/lib/academy/library/data/aula-03.json')
    previous = json.loads(editorial.read_text()) if editorial.exists() else {}
    if previous.get('status') != 'missing' and previous.get('pages'):
        assert previous['originalSha256'] == digest, 'Fonte diferente da revisão existente.'
        content = {**previous, 'pdfParts': parts}
    else:
        content = {'courseNumber': 3, 'expectedPageCount': 187, 'pageCount': 187,
                   'sourceFile': '1793834496236-compress-guias-visuais-de-ponto-do-motor-3.pdf', 'originalSha256': digest, 'technicalReview': 'pending',
                   'pdfParts': parts, 'reviewNotes': ['PDF integral importado. Transcrições e revisão técnica pendentes.'],
                   'pages': [{**p, 'title': f'Página {p["number"]}', 'transcript': [],
                              'description': f'Página {p["number"]} integral da referência Ponto do Motor. Descrição técnica pendente de conferência visual.',
                              'review': 'pending'} for p in files]}
    helper.write_json(editorial, content)
    helper.write_json(root / 'content.json', content)
    index_path = root.parent / 'index.json'
    index = json.loads(index_path.read_text())
    for item in index['courses']:
        if item['courseNumber'] == 3:
            item.update(pageCount=187, status='imported', originalSha256=digest)
    helper.write_json(index_path, index)
    helper.verify_imports(root.parent, Path('work/library-review/asset-integrity-report.json'), True)
    print(json.dumps({'pdfParts': parts, 'pagesPreserved': 187}, ensure_ascii=False))


if __name__ == '__main__':
    main()
