#!/usr/bin/env python3
"""Deterministic migration overlay and safe archive verification; no network/deploy."""
import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import shutil
import stat
import subprocess
from urllib.parse import unquote, urljoin, urlparse
import zipfile

ROOT = Path(__file__).resolve().parent.parent
DISCOVERY = ['sitemap-0.xml', 'story/rss.xml', 'llms.txt']
PREFIXES = ['_astro/', 'assets/living-systems/', 'fonts/', 'downloads/']

def require(condition, message):
    if not condition:
        raise ValueError(message)

def digest(data):
    return hashlib.sha256(data).hexdigest()

def contract():
    return json.loads(subprocess.check_output(['node', '--input-type=module', '-e',
        "import {RECOVERY_COMPATIBILITY_ROUTES as routes,RECOVERY_REQUIRED_PATHS as required} from './scripts/release-artifact.mjs';console.log(JSON.stringify({routes,required}));"], cwd=ROOT, text=True))

def safe_path(value):
    return bool(value) and not value.startswith('/') and '\\' not in value and not any(ord(c) < 32 or ord(c) == 127 for c in value) and all(p not in ['', '.', '..'] for p in value.split('/'))

def inventory(root):
    rows = []
    for p in sorted(root.rglob('*')):
        require(not p.is_symlink(), 'Artifact contains a symbolic link')
        if p.is_dir():
            continue
        require(p.is_file() and p.stat().st_nlink == 1, 'Unsupported artifact file')
        rel = p.relative_to(root).as_posix()
        require(safe_path(rel), 'Unsafe artifact path')
        data = p.read_bytes()
        rows.append({'path': rel, 'bytes': len(data), 'sha256': digest(data)})
    return rows

def indexed(rows):
    require(isinstance(rows, list), 'Invalid proof inventory')
    result = {}
    for row in rows:
        require(safe_path(row['path']) and row['path'] not in result and isinstance(row['bytes'], int) and row['bytes'] >= 0 and re.fullmatch('[0-9a-f]{64}', row['sha256']), 'Invalid proof entry')
        result[row['path']] = row
    return result

def merged_discovery(base, candidate, routes):
    urls = {'https://orionfold.com' + row['route'] for row in routes}
    sitemap = base['sitemap-0.xml']
    entries = re.findall(r'<url>.*?</url>', candidate['sitemap-0.xml'], re.S)
    for url in sorted(urls):
        entry = next((entry for entry in entries if f'<loc>{url}</loc>' in entry), None)
        require(entry is not None and f'<loc>{url}</loc>' not in sitemap, 'Non-additive sitemap route')
        require('</urlset>' in sitemap, 'Missing sitemap close')
        sitemap = sitemap.replace('</urlset>', entry + '</urlset>')
    rss = base['story/rss.xml']
    additions = []
    for item in re.findall(r'<item>.*?</item>', candidate['story/rss.xml'], re.S):
        link = re.search(r'<link>(.*?)</link>', item)
        if link and link.group(1) in urls:
            require(link.group(1) not in rss, 'Non-additive RSS route')
            additions.append(item)
    if additions:
        require('<item>' in rss, 'Missing RSS insertion point')
        rss = rss.replace('<item>', '\n    '.join(additions) + '\n    <item>', 1)
        latest = re.search(r'<lastBuildDate>.*?</lastBuildDate>', candidate['story/rss.xml'], re.S)
        if latest:
            rss = re.sub(r'<lastBuildDate>.*?</lastBuildDate>', lambda _: latest.group(0), rss, count=1, flags=re.S)
    llms = base['llms.txt']
    lines = []
    for url in sorted(urls):
        line = next((line for line in candidate['llms.txt'].splitlines() if f']({url})' in line), None)
        require(line is not None and f']({url})' not in llms, 'Non-additive LLM route')
        lines.append(line)
    llms += '\n## Living Documents compatibility routes\n' + '\n'.join(lines) + '\n'
    return dict(zip(DISCOVERY, [sitemap, rss, llms]))

def compatible_page(row, original):
    if row['page'].startswith('flow/'):
        return original.replace('href="/flow/#get-flow"', 'href="/flow/#pricing"')
    return original

def prepare(base, candidate, target, proof_path):
    require(base.resolve() != target.resolve() and candidate.resolve() != target.resolve(), 'Overlay must have its own output directory')
    require(not target.exists(), 'Overlay output must be absent')
    c = contract()
    base_rows, candidate_rows = inventory(base), inventory(candidate)
    b, n = indexed(base_rows), indexed(candidate_rows)
    require(all(path in n for path in c['required']), 'Missing candidate compatibility surface')
    require('id="pricing"' in (base / 'flow/index.html').read_text(), 'Baseline pricing anchor is absent')
    for row in c['routes']:
        require(row['page'] not in b and row['og'] not in b, 'Compatibility route must be additive')
    proof = {'schemaVersion': 1, 'contract': c, 'baseline': base_rows, 'candidate': candidate_rows,
        'baselineDiscovery': {p: (base / p).read_text() for p in DISCOVERY},
        'candidateDiscovery': {p: (candidate / p).read_text() for p in DISCOVERY},
        'candidatePages': {r['page']: (candidate / r['page']).read_text() for r in c['routes']}}
    shutil.copytree(base, target)
    for rel in n:
        if rel not in b and any(rel.startswith(prefix) for prefix in PREFIXES):
            dest = target / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(candidate / rel, dest)
    for row in c['routes']:
        for rel in [row['page'], row['og']]:
            (target / rel).parent.mkdir(parents=True, exist_ok=True)
            if rel == row['page']:
                (target / rel).write_text(compatible_page(row, proof['candidatePages'][rel]))
            else:
                shutil.copyfile(candidate / rel, target / rel)
    for rel, text in merged_discovery(proof['baselineDiscovery'], proof['candidateDiscovery'], c['routes']).items():
        (target / rel).write_text(text)
    proof_path.parent.mkdir(parents=True, exist_ok=True)
    proof_path.write_text(json.dumps(proof, separators=(',', ':')) + '\n')
    return verify(target, proof)

def css_urls(text):
    return [url.strip().strip('"\'') for url in re.findall(r'url\(\s*([^)]*?)\s*\)', text)]

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.refs, self.og = set(), [], None
    def handle_starttag(self, tag, attrs):
        v = dict(attrs)
        if 'id' in v:
            self.ids.add(v['id'])
        if tag == 'a' and v.get('href'):
            self.refs.append((v['href'], False))
        if tag in ['img', 'script', 'source', 'video', 'audio'] and v.get('src'):
            self.refs.append((v['src'], True))
        if v.get('poster'):
            self.refs.append((v['poster'], True))
        if tag in ['img', 'source'] and v.get('srcset'):
            self.refs.extend((part.strip().split()[0], True) for part in v['srcset'].split(',') if part.strip())
        if tag == 'link' and v.get('href'):
            self.refs.append((v['href'], any(i in v.get('rel', '').split() for i in ['stylesheet', 'preload', 'modulepreload', 'icon', 'apple-touch-icon', 'manifest'])))
        if tag == 'meta' and v.get('property') == 'og:image':
            self.og = v.get('content')
            if self.og:
                self.refs.append((self.og, True))
        if v.get('style'):
            self.refs.extend((url, True) for url in css_urls(v['style']))

def verify(site, proof):
    c = contract()
    require(proof.get('schemaVersion') == 1 and proof['contract'] == c, 'Stale compatibility contract')
    b, n, actual = indexed(proof['baseline']), indexed(proof['candidate']), indexed(inventory(site))
    allowed_new = {p for r in c['routes'] for p in [r['page'], r['og']]}
    for rel, row in b.items():
        require(rel in actual and (rel in DISCOVERY or row == actual[rel]), 'Baseline bytes changed: ' + rel)
    for rel, row in actual.items():
        if rel not in b:
            require(rel in allowed_new or any(rel.startswith(prefix) for prefix in PREFIXES), 'Unexpected overlay addition: ' + rel)
            require(rel in n, 'Overlay addition missing from candidate')
            if not any(rel == r['page'] for r in c['routes']):
                require(row == n[rel], 'Candidate asset bytes changed: ' + rel)
    for path in c['required']:
        require(path in actual, 'Missing required compatibility path: ' + path)
    for mapping, rows in [(proof['baselineDiscovery'], b), (proof['candidateDiscovery'], n), (proof['candidatePages'], n)]:
        for rel, text in mapping.items():
            require(digest(text.encode()) == rows[rel]['sha256'], 'Proof text differs from inventory: ' + rel)
    for rel, text in merged_discovery(proof['baselineDiscovery'], proof['candidateDiscovery'], c['routes']).items():
        require((site / rel).read_text() == text, 'Unexpected discovery mutation: ' + rel)
    pending, checked, pages = [], set(), {}
    def read_page(path):
        if path not in pages:
            page = Page()
            page.feed(path.read_text())
            pages[path] = page
        return pages[path]
    def reference(href, context, asset):
        if asset and href.startswith('#'):
            return
        parsed = urlparse(urljoin('https://orionfold.com' + context, href))
        if parsed.scheme not in ['http', 'https'] or parsed.netloc != 'orionfold.com':
            return
        path = site / unquote(parsed.path).lstrip('/')
        require(path.resolve().is_relative_to(site.resolve()), 'Reference escapes site')
        if path.is_dir():
            path /= 'index.html'
        require(path.is_file(), 'Missing reference: ' + context + ' -> ' + href)
        if parsed.fragment and path.suffix == '.html':
            require(unquote(parsed.fragment) in read_page(path).ids, 'Missing fragment: ' + context + ' -> ' + href)
        if asset or path.suffix.lower() in ['.pdf', '.md', '.webp', '.png', '.jpg', '.svg', '.woff2', '.js', '.css']:
            pending.append(path)
    for row in c['routes']:
        path = site / row['page']
        require(path.read_text() == compatible_page(row, proof['candidatePages'][row['page']]), 'Undeclared page mutation')
        page = read_page(path)
        require(page.og and urlparse(page.og).path.lstrip('/') == row['og'], 'Wrong compatibility OG')
        for href, asset in page.refs:
            reference(href, row['route'], asset)
    while pending:
        path = pending.pop()
        rel = path.relative_to(site).as_posix()
        if rel in checked:
            continue
        checked.add(rel)
        require(rel in n and actual[rel] == n[rel], 'Candidate dependency collision: ' + rel)
        if path.suffix == '.css':
            for href in css_urls(path.read_text()):
                reference(href, '/' + rel, True)
        elif path.suffix == '.js':
            for href in re.findall(r'(?:from\s*|import\s*\(\s*)["\']([^"\']+)["\']', path.read_text()):
                if href.startswith(('.', '/')):
                    reference(href, '/' + rel, True)
    require('<loc>https://orionfold.com/sitemap-0.xml</loc>' in (site / 'sitemap-index.xml').read_text(), 'Undiscoverable sitemap')
    return {'verified': True, 'files': len(actual), 'baselineFilesPreserved': len(b) - len(DISCOVERY), 'assetsChecked': len(checked), 'routes': [r['route'] for r in c['routes']]}

def unpack(archive, target):
    require(not target.exists(), 'Extraction output must be absent')
    with zipfile.ZipFile(archive) as z:
        members = z.infolist()
        require(len(members) <= 20000 and sum(m.file_size for m in members) <= 2 * 1024**3, 'Archive exceeds extraction budget')
        seen = set()
        for m in members:
            rel = m.filename.rstrip('/') if m.is_dir() else m.filename
            mode = m.external_attr >> 16
            require(safe_path(rel) and rel not in seen, 'Unsafe or duplicate archive path')
            require(rel in ['site', 'manifest.json', 'overlay-proof.json'] or rel.startswith('site/'), 'Unexpected bundle member')
            require(not stat.S_ISLNK(mode) and (not stat.S_IFMT(mode) or stat.S_ISREG(mode) or stat.S_ISDIR(mode)), 'Unsupported archive member')
            seen.add(rel)
        target.mkdir(parents=True)
        for m in members:
            p = target / m.filename
            if m.is_dir():
                p.mkdir(parents=True, exist_ok=True)
            else:
                p.parent.mkdir(parents=True, exist_ok=True)
                with z.open(m) as src, p.open('xb') as dest:
                    shutil.copyfileobj(src, dest)

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('command', choices=['prepare', 'verify', 'unpack'])
    for flag in ['baseline', 'candidate', 'site', 'proof', 'archive', 'target']:
        p.add_argument('--' + flag, type=Path)
    a = p.parse_args()
    try:
        if a.command == 'prepare':
            result = prepare(a.baseline, a.candidate, a.site, a.proof)
        elif a.command == 'verify':
            result = verify(a.site, json.loads(a.proof.read_text()))
        else:
            unpack(a.archive, a.target)
            result = {'unpacked': True}
        print(json.dumps(result))
    except (ValueError, KeyError, TypeError, OSError, zipfile.BadZipFile) as e:
        p.exit(1, str(e) + '\n')
