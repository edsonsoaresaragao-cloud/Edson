"""Importa os PDFs das Aulas 03–10 sem publicar nem alterar seus cabeçalhos.

Uso: python scripts/academy/import-library-material.py --source-dir /workspace/attachments
Requer PyMuPDF, Pillow e Tesseract somente na preparação editorial.
OCR é sempre rascunho: a importação nunca aprova transcrição ou publicação.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import io
import json
import os
from pathlib import Path
import shutil
import subprocess

import fitz
from PIL import Image, ImageDraw


SOURCES = {
    3: (187, '1793834496236-compress-guias-visuais-de-ponto-do-motor.pdf'),
    4: (61, '1793834480839-bonus-01-30-guias-motores-menos-frequentes.pdf'),
    5: (17, '1793834460340-bonus-04-ferramentas-de-travamento.pdf'),
    6: (41, '1793834471159-bonus-02-correia-de-acessorios-por-motor.pdf'),
    7: (11, '1793833614652-bonus-05-pecas-para-trocar-junto-e-orcamento.pdf'),
    8: (14, '1794148571138-extra-codigos-de-falha-de-sincronismo.pdf'),
    9: (8, '1794148361173-extra-teste-de-valvula-empenada.pdf'),
    10: (19, '1794148587325-extra-torque-e-sequencia-de-aperto-do-cabecote.pdf'),
}


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def immutable_copy(source: Path, target: Path) -> str:
    digest = sha256(source.read_bytes())
    if target.exists():
        assert sha256(target.read_bytes()) == digest, f'Original diferente: {target}'
    else:
        shutil.copyfile(source, target)
    return digest


def page_images(doc: fitz.Document, number: int, destination: Path) -> dict:
    page = doc[number - 1]
    images = page.get_images(full=True)
    # Os sete anexos conferidos possuem uma imagem JPEG que ocupa toda a página.
    # A extração mantém os bytes JPEG originais, sem nova compressão nem recorte.
    assert len(images) == 1, f'Página {number}: estrutura exige conferência editorial'
    xref = images[0][0]
    rects = page.get_image_rects(xref)
    assert len(rects) == 1 and rects[0] == page.rect, f'Página {number}: imagem parcial'
    native = doc.extract_image(xref)
    assert native['ext'] == 'jpeg', f'Página {number}: formato ainda não conferido'
    original_pixels = fitz.Pixmap(native['image'])
    sx = original_pixels.width / page.rect.width
    sy = original_pixels.height / page.rect.height
    rendered = page.get_pixmap(matrix=fitz.Matrix(sx, sy), alpha=False)
    assert original_pixels.samples == rendered.samples, f'Página {number}: divergência visual'
    image_name = f'pagina-{number:03}.jpg'
    preview_name = f'preview-{number:03}.webp'
    (destination / image_name).write_bytes(native['image'])
    with Image.open(io.BytesIO(native['image'])) as image:
        image.thumbnail((640, 960), Image.Resampling.LANCZOS)
        image.save(destination / preview_name, 'WEBP', quality=82, method=5)
    return {
        'number': number,
        'image': image_name,
        'preview': preview_name,
        'width': original_pixels.width,
        'height': original_pixels.height,
        'sourceSha256': sha256(native['image']),
        'previewSha256': sha256((destination / preview_name).read_bytes()),
        'identicalToPdfRender': True,
        'headerModified': False,
    }


def ocr_page(image: Path, cache: Path, language: str) -> list[str]:
    if cache.exists():
        text = cache.read_text()
    else:
        # Texto pequeno é ampliado apenas na entrada temporária do OCR.
        with Image.open(image) as native:
            enlarged = native.resize((native.width * 3 // 2, native.height * 3 // 2), Image.Resampling.LANCZOS)
            buffer = io.BytesIO()
            enlarged.save(buffer, 'PNG')
        result = subprocess.run(
            ['tesseract', 'stdin', 'stdout', '-l', language, '--dpi', '144', '--psm', '3'],
            input=buffer.getvalue(), stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            timeout=90, check=True, env={**os.environ, 'OMP_THREAD_LIMIT': '1'},
        )
        text = result.stdout.decode('utf-8')
        cache.parent.mkdir(parents=True, exist_ok=True)
        cache.write_text(text)
    return [' '.join(line.split()) for line in text.splitlines() if line.strip()]


def contact_sheets(course: int, directory: Path, files: list[dict], review: Path) -> None:
    for start in range(0, len(files), 12):
        sheet = Image.new('RGB', (4 * 256, 3 * 410), '#d5dce4')
        draw = ImageDraw.Draw(sheet)
        for offset, page in enumerate(files[start:start + 12]):
            x, y = (offset % 4) * 256, (offset // 4) * 410
            with Image.open(directory / page['image']) as native:
                native.thumbnail((250, 375), Image.Resampling.LANCZOS)
                sheet.paste(native, (x + (256 - native.width) // 2, y + 22))
            draw.text((x + 8, y + 5), f'Aula {course:02} / pagina {page["number"]:03}', fill='black')
        review.mkdir(parents=True, exist_ok=True)
        sheet.save(review / f'aula-{course:02}-contato-{start // 12 + 1:02}.jpg', quality=92)


def verify_imports(directory: Path, report_path: Path, require_all: bool) -> None:
    courses, total = [], 0
    for course, (expected, _) in SOURCES.items():
        destination = directory / f'aula-{course:02}'
        manifest = json.loads((destination / 'manifest.json').read_text())
        if manifest.get('status') == 'missing':
            assert not manifest.get('pages'), 'Documento ausente não pode conter páginas inventadas'
            courses.append({'courseNumber': course, 'expectedPages': expected, 'actualPages': 0, 'status': 'missing'})
            continue
        original = destination / 'original.pdf'
        assert sha256(original.read_bytes()) == manifest['originalSha256'], f'Original alterado: {course}'
        with fitz.open(original) as doc:
            files = manifest['files']
            assert len(doc) == len(files) == manifest['pageCount'] == expected, f'Página ausente: {course}'
            for number, item in enumerate(files, 1):
                assert item['number'] == number, f'Ordem de páginas inválida: {course}'
                image = (destination / item['image']).read_bytes()
                preview = (destination / item['preview']).read_bytes()
                assert sha256(image) == item['sourceSha256'], f'Imagem alterada: {course}/{number}'
                assert sha256(preview) == item['previewSha256'], f'Prévia alterada: {course}/{number}'
                pixels = fitz.Pixmap(image)
                page = doc[number - 1]
                rendered = page.get_pixmap(matrix=fitz.Matrix(pixels.width / page.rect.width, pixels.height / page.rect.height), alpha=False)
                assert pixels.samples == rendered.samples, f'Fidelidade visual inválida: {course}/{number}'
                assert pixels.width == item['width'] == 1024 and pixels.height == item['height'] == 1536
                with Image.open(io.BytesIO(preview)) as small:
                    small.load()
                    assert small.size == (640, 960), f'Prévia incompleta: {course}/{number}'
                assert item['headerModified'] is False
            total += len(files)
            courses.append({'courseNumber': course, 'expectedPages': expected, 'actualPages': len(files),
                            'originalSha256': manifest['originalSha256'], 'nativePixelComparisons': len(files),
                            'nativeImagesAndPreviewsValid': True, 'headersUnchanged': True, 'status': 'verified-assets'})
    report = {'expectedPages': 358, 'importedPages': total, 'fullSetReady': total == 358,
              'authorization': 'pending', 'transcriptionReview': 'separate-editorial-gate', 'courses': courses}
    write_json(report_path, report)
    print(json.dumps({'importedPages': total, 'fullSetReady': total == 358, 'report': str(report_path)}, ensure_ascii=False))
    if require_all and total != 358:
        raise SystemExit('Conjunto incompleto: a Aula 03 de 187 páginas ainda não foi importada.')


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', type=Path)
    parser.add_argument('--output', type=Path, default=Path('academy-materials/library'))
    parser.add_argument('--editorial', type=Path, default=Path('src/lib/academy/library/data'))
    parser.add_argument('--review-dir', type=Path, default=Path('work/library-review'))
    parser.add_argument('--ocr-language', default='eng')
    parser.add_argument('--ocr-workers', type=int, default=4)
    parser.add_argument('--verify-only', action='store_true')
    parser.add_argument('--require-all', action='store_true', help='Falha se qualquer uma das 358 páginas estiver ausente.')
    args = parser.parse_args()
    if args.verify_only:
        verify_imports(args.output, args.review_dir / 'asset-integrity-report.json', args.require_all)
        return
    if args.source_dir is None:
        parser.error('--source-dir é obrigatório para importar')
    args.output.mkdir(parents=True, exist_ok=True)
    index, pending = [], []
    for course, (expected, filename) in SOURCES.items():
        matches = list(args.source_dir.rglob(filename))
        assert len(matches) <= 1, f'Anexos duplicados: {filename}'
        destination = args.output / f'aula-{course:02}'
        destination.mkdir(parents=True, exist_ok=True)
        if not matches:
            missing = {'courseNumber': course, 'expectedPageCount': expected, 'pageCount': 0,
                       'sourceFile': filename, 'originalSha256': '', 'technicalReview': 'pending',
                       'status': 'missing', 'pages': []}
            write_json(destination / 'manifest.json', missing)
            write_json(destination / 'content.json', missing)
            target = args.editorial / f'aula-{course:02}.json'
            if not target.exists():
                write_json(target, missing)
            index.append({'courseNumber': course, 'expectedPageCount': expected, 'pageCount': 0, 'status': 'missing'})
            print(f'Aula {course:02}: arquivo ausente; nenhuma página fabricada.', flush=True)
            continue
        digest = immutable_copy(matches[0], destination / 'original.pdf')
        with fitz.open(destination / 'original.pdf') as doc:
            assert len(doc) == expected, f'Aula {course:02}: {len(doc)} páginas; esperadas {expected}'
            files = [page_images(doc, n + 1, destination) for n in range(len(doc))]
        manifest = {'courseNumber': course, 'source': 'Ponto do Motor', 'sourceFile': filename,
                    'expectedPageCount': expected, 'pageCount': expected, 'originalSha256': digest,
                    'originalFile': 'original.pdf', 'authorization': 'pending',
                    'adaptation': 'Nenhuma alteração de cabeçalho; autorização de derivação não confirmada.',
                    'files': files}
        write_json(destination / 'manifest.json', manifest)
        contact_sheets(course, destination, files, args.review_dir)
        index.append({'courseNumber': course, 'expectedPageCount': expected, 'pageCount': expected, 'status': 'imported', 'originalSha256': digest})
        pending.append((course, destination, files, filename, digest))
        print(f'Aula {course:02}: {expected} imagens nativas extraídas e comparadas ao PDF.', flush=True)
    write_json(args.output / 'index.json', {'expectedPageCount': 358, 'courses': index})
    # Imagens ficam prontas antes do OCR para permitir a conferência visual em paralelo.
    with ThreadPoolExecutor(max_workers=args.ocr_workers) as executor:
        futures = {}
        results = {}
        for course, destination, files, filename, digest in pending:
            for page in files:
                # A chave inclui idioma e imagem: não reutilizar OCR de outro
                # modelo linguístico nem de uma referência visual diferente.
                cache = (args.review_dir / 'ocr' / args.ocr_language / f'aula-{course:02}'
                         / f'pagina-{page["number"]:03}-{page["sourceSha256"][:16]}.txt')
                futures[executor.submit(ocr_page, destination / page['image'], cache, args.ocr_language)] = (course, page['number'])
        for future in as_completed(futures):
            key = futures[future]
            results[key] = future.result()
            if key[1] == 1:
                print(f'Aula {key[0]:02}: OCR iniciado; todo texto permanece pendente.', flush=True)
    for course, destination, files, filename, digest in pending:
        pages = []
        for page in files:
            transcript = results[(course, page['number'])]
            pages.append({
                **page, 'id': f'aula-{course:02}:pagina-{page["number"]:03}',
                'title': ' '.join(transcript[:2])[:180] or f'Página {page["number"]}',
                'transcript': transcript,
                'description': f'Página {page["number"]} integral da referência Ponto do Motor. Descrição técnica pendente de conferência visual.',
                'review': 'pending', 'manufacturer': '', 'engine': '', 'models': [],
                'guide': '', 'part': '', 'topics': [],
            })
        content = {'courseNumber': course, 'expectedPageCount': len(files), 'pageCount': len(files),
                   'sourceFile': filename, 'originalSha256': digest, 'technicalReview': 'pending',
                   'ocrLanguage': args.ocr_language, 'ocrWarning': 'Rascunho automático; números, códigos, unidades, leitura de tabelas e completude ainda exigem conferência visual.',
                   'pages': pages}
        private_copy = destination / 'content.json'
        if not private_copy.exists():
            write_json(private_copy, content)
        target = args.editorial / f'aula-{course:02}.json'
        if not target.exists():
            write_json(target, content)
        print(f'Aula {course:02}: {len(pages)} rascunhos OCR prontos; nenhuma publicação aprovada.', flush=True)
    verify_imports(args.output, args.review_dir / 'asset-integrity-report.json', args.require_all)


if __name__ == '__main__':
    main()
