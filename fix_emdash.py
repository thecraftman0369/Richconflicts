#!/usr/bin/env python3
"""
fix_emdash.py

Replaces em-dashes (—) in files:
  " — " (space em-dash space)  →  " " (single space)
  "—"   (no surrounding space) →  " " (single space)

Usage:
  python fix_emdash.py file1.txt file2.tsx ...
  python fix_emdash.py --glob "src/**/*.tsx"
  python fix_emdash.py --inplace file.txt
"""

import re
import sys
import glob
import argparse
from pathlib import Path


EM_DASH = '—'

# Order matters: replace spaced version first, then bare
REPLACEMENTS = [
    (re.compile(r' ' + EM_DASH + r' '), ' '),   # " — " → " "
    (re.compile(EM_DASH),               ' '),   # "—"   → " "
]


def fix_text(text: str) -> str:
    for pattern, replacement in REPLACEMENTS:
        text = pattern.sub(replacement, text)
    return text


def fix_file(path: Path, inplace: bool) -> int:
    original = path.read_text(encoding='utf-8')
    fixed = fix_text(original)

    changes = sum(
        len(pattern.findall(original))
        for pattern, _ in REPLACEMENTS
    )

    if changes == 0:
        print(f'  no changes  {path}')
        return 0

    if inplace:
        path.write_text(fixed, encoding='utf-8')
        print(f'  fixed {changes:>3} em-dash(es)  {path}')
    else:
        print(f'  would fix {changes:>3} em-dash(es)  {path}  (dry run — use --inplace to apply)')

    return changes


def main():
    parser = argparse.ArgumentParser(description='Replace em-dashes in text files.')
    parser.add_argument('files', nargs='*', help='Files to process')
    parser.add_argument('--glob', help='Glob pattern, e.g. "src/**/*.tsx"')
    parser.add_argument('--inplace', action='store_true', help='Write changes back to files')
    args = parser.parse_args()

    paths: list[Path] = []

    for f in args.files:
        paths.append(Path(f))

    if args.glob:
        paths.extend(Path(p) for p in glob.glob(args.glob, recursive=True))

    if not paths:
        parser.print_help()
        sys.exit(0)

    total = 0
    for path in paths:
        if not path.is_file():
            print(f'  skipped (not a file): {path}')
            continue
        total += fix_file(path, inplace=args.inplace)

    print(f'\nTotal em-dashes {"fixed" if args.inplace else "found"}: {total}')


if __name__ == '__main__':
    main()
