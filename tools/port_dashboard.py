#!/usr/bin/env python3
"""
Turn the dashboard page written in Claude (an artifact) into the public dashboard/index.html.

    python3 tools/port_dashboard.py path/to/page.html            # writes dashboard/index.html
    python3 tools/port_dashboard.py path/to/page.html --check    # only report, write nothing

The artifact page is a fragment: it has no <html>/<head>, and it relies on Claude's dashboard host
(the `dash` object, the page layout, the colour tokens). To run as a normal website it needs:

  1. a shell around it           -> tools/dashboard-shell.html (head, back link, footer, privacy link)
  2. each inline <script> wrapped in its own function, because the artifact host gives every script
     its own scope and the page re-declares the same names (for example `const NKC`) in several scripts
  3. one hook so the plan lock in gate.js is re-applied whenever the dashboard changes section

Everything else (the page's own markup, styles and code) is copied unchanged.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SHELL = ROOT / 'tools' / 'dashboard-shell.html'
OUT = ROOT / 'dashboard' / 'index.html'

HOOK_ANCHOR = "    document.querySelectorAll('#pg-market section[data-cat]').forEach((s) => { s.hidden = s.dataset.cat !== cat; });\n"
HOOK_LINE = "    if (window.NK_PLANS) window.NK_PLANS.apply(cat);   // plan lock (gate.js): replaces a Searcher-only section with an upgrade panel\n"


def port(page: str) -> str:
    shell = SHELL.read_text(encoding='utf-8')

    # split the artifact page: [fonts link] [brand <style>] [everything else]
    fonts, rest = page.split('\n', 1)
    if not fonts.startswith('<link rel="stylesheet" href="https://fonts.googleapis.com'):
        raise SystemExit('Unexpected page start: the first line should be the Google Fonts <link>.')
    cut = rest.index('</style>\n') + len('</style>\n')
    brand, body = rest[:cut], rest[cut:]
    if not brand.startswith('<style>\n/* Next Keepers brand'):
        raise SystemExit('Unexpected page: the first <style> block should be the Next Keepers brand tokens.')
    if not body.startswith('<style>\n#dash-root { --dash-gutter'):
        raise SystemExit('Unexpected page: the second <style> block should start with the dashboard layout rules.')

    # 2. wrap every inline script (the ones with no src) in its own function
    def wrap(match):
        return '<script>\n(function () {\n' + match.group(1) + '\n})();\n</script>'
    body, n_scripts = re.subn(r'<script>\n(.*?)</script>', wrap, body, flags=re.S)

    # 3. the plan-lock hook
    if body.count(HOOK_ANCHOR) != 1:
        raise SystemExit(f'Could not place the plan-lock hook: found {body.count(HOOK_ANCHOR)} matches for applyViews.')
    body = body.replace(HOOK_ANCHOR, HOOK_ANCHOR + HOOK_LINE)

    # the page must end with the private-tabs script; the shell supplies what follows
    if not body.rstrip().endswith('<script src="mine.js"></script>'):
        raise SystemExit('Unexpected page end: expected <script src="mine.js"></script> last.')

    html = (shell.replace('<!-- @@FONTS@@ -->\n', fonts + '\n')
                 .replace('<!-- @@BRAND_STYLE@@ -->\n', brand)
                 .replace('<!-- @@PAGE_BODY@@ -->\n', body.rstrip('\n') + '\n'))
    print(f'wrapped {n_scripts} inline scripts; wrote {len(html):,} bytes')
    return html


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(args) != 1:
        raise SystemExit(__doc__)
    result = port(Path(args[0]).read_text(encoding='utf-8'))
    if '--check' in sys.argv:
        print('check only: nothing written')
    else:
        OUT.write_text(result, encoding='utf-8')
        print('wrote', OUT.relative_to(ROOT))
