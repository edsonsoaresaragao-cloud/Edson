"""Mescla conferências editoriais explícitas; nunca aprova OCR automaticamente.

Uso: python scripts/academy/apply-library-review.py arquivo-de-revisao.json [...]
Os dados resultantes permanecem no diretório privado/ignorado até publicação autorizada.
"""
import json
import sys
from pathlib import Path

root = Path('src/lib/academy/library/data')
def note_lines(value):
    values = value if isinstance(value, list) else [value]
    result = []
    for note in values:
        if isinstance(note, str):
            result.append(note)
        elif isinstance(note, dict) and isinstance(note.get('note'), str):
            prefix = f"Página {note['page']}: " if 'page' in note else ''
            result.append(prefix + note['note'])
        else:
            raise ValueError('Nota editorial sem texto reconhecido; conferir a revisão antes de mesclar.')
    return result

for name in sys.argv[1:]:
    overlay = json.loads(Path(name).read_text())
    courses = overlay.get('courses', overlay)
    for key, review in courses.items():
        if not key.startswith('aula-') or not isinstance(review, dict):
            continue
        target = root / f'{key}.json'
        data = json.loads(target.read_text())
        by_number = {page['number']: page for page in data['pages']}
        for incoming in review.get('pages', []):
            number = incoming['number']
            if number not in by_number:
                raise ValueError(f'{key}: página de revisão inexistente: {number}')
            page = by_number[number]
            for field in ['title', 'transcript', 'description', 'review', 'manufacturer', 'engine', 'models', 'guide', 'part', 'topics']:
                if field in incoming:
                    page[field] = incoming[field]
            teacher = incoming.get('teacher', incoming.get('teacherExplanation'))
            if teacher:
                page['teacher'] = teacher
            notes = incoming.get('reviewNotes', incoming.get('technicalNotes'))
            if notes:
                page['reviewNotes'] = note_lines(notes)
        if 'questions' in review:
            data['questions'] = review['questions']
        notes = review.get('reviewNotes', review.get('technicalNotes'))
        if notes:
            data['reviewNotes'] = note_lines(notes)
        # Conferência de texto não substitui a validação técnica do documento.
        data['technicalReview'] = review.get('technicalReview', 'pending')
        data['reviewSource'] = str(Path(name))
        target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
        print(f"{key}: {sum(p['review'] == 'verified' for p in data['pages'])}/{data['pageCount']} transcrições conferidas; revisão técnica: {data['technicalReview']}")
