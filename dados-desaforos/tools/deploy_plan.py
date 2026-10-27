"""Prepara um deploy pelo conector do Vercel (sem Git).

Compara a árvore atual com o commit importado do deploy 5.3.1 e grava:
  tools/deploy-plan.json  - diferenças por caractere (arquivos alterados) e lista da base
  <saida>/deploy-files.json - lista `files` para create_deployment (só o que precisa subir)
Uso: python3 tools/deploy_plan.py <release> <pasta-de-saída>   (base em tools/deploy-base.json)
"""
import difflib, hashlib, json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Último deploy de produção: commit com o mesmo conteúdo, URL imutável e versões que ele já contém.
BASE = json.load(open(os.path.join(ROOT, 'tools/deploy-base.json')))
BASE_COMMIT, BASE_URL = BASE['commit'], BASE['url']
SKIP = ('releases/', 'tests/', 'tools/', 'docs/', 'icons/ui/', 'dist/', '.gitignore')
CONFIG = {'vercel.json'}


def git(*args):
    return subprocess.run(['git', '-C', ROOT, *args], capture_output=True, check=True).stdout


def base_files():
    names = git('ls-tree', '-r', '--name-only', '--full-name', BASE_COMMIT, '--', '.').decode().split('\n')
    prefix = 'dados-desaforos/'
    return sorted(n[len(prefix):] for n in names if n.startswith(prefix) and not n[len(prefix):].startswith(SKIP) and n[len(prefix):] not in CONFIG)


def u16(s):
    """Índices de JavaScript (UTF-16) para cada posição do texto Python."""
    out, n = [0], 0
    for ch in s:
        n += 2 if ord(ch) > 0xFFFF else 1
        out.append(n)
    return out


def char_ops(a, b):
    ia, ops = u16(a), []
    la, lb = a.splitlines(keepends=True), b.splitlines(keepends=True)
    starts = [0]
    for line in la:
        starts.append(starts[-1] + len(line))
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, la, lb, autojunk=False).get_opcodes():
        if tag == 'equal':
            continue
        old, new, at = ''.join(la[i1:i2]), ''.join(lb[j1:j2]), starts[i1]
        fine = [o for o in difflib.SequenceMatcher(None, old, new, autojunk=False).get_opcodes() if o[0] != 'equal']
        if sum(len(new[o[3]:o[4]]) + 12 for o in fine) > len(new):  # texto reescrito: um trecho único é menor
            fine = [('replace', 0, len(old), 0, len(new))]
        for t, a1, a2, b1, b2 in fine:
            ops.append([ia[at + a1], ia[at + a2] - ia[at + a1], new[b1:b2]])
    return ops


def main():
    release, outdir = sys.argv[1], sys.argv[2]
    old_releases = [[v, BASE_URL] for v in BASE['releases'] if v != release]
    base = base_files()
    patches, uploaded, removed = {}, [], []
    for rel in base:
        path = os.path.join(ROOT, rel)
        if not os.path.exists(path):
            removed.append(rel)
            continue
        old, new = git('show', f'{BASE_COMMIT}:dados-desaforos/{rel}'), open(path, 'rb').read()
        if old == new:
            continue
        try:
            a, b = old.decode('utf-8'), new.decode('utf-8')
        except UnicodeDecodeError:
            uploaded.append(rel)
            continue
        ops = char_ops(a, b)
        size = sum(len(o[2]) + 24 for o in ops)
        if size > len(b) * 0.8:
            uploaded.append(rel)
        else:
            patches[rel] = {'sha': hashlib.sha1(old).hexdigest(), 'result': hashlib.sha1(new).hexdigest(), 'ops': ops}
    for d, _, fs in os.walk(ROOT):
        for f in fs:
            rel = os.path.relpath(os.path.join(d, f), ROOT).replace(os.sep, '/')
            if rel.startswith(SKIP) or rel in CONFIG or rel in base:
                continue
            uploaded.append(rel)
    groups = {}
    for f in base:
        d, _, n = f.rpartition('/')
        groups.setdefault(d, []).append(n)
    plan = {'base': BASE_URL, 'release': release, 'baseFiles': ';'.join(d + ':' + ','.join(n) for d, n in groups.items()),
            'patches': patches, 'uploaded': sorted(uploaded), 'removed': removed, 'oldReleases': old_releases,
            'sums': {rel: hashlib.sha1(open(os.path.join(ROOT, rel), 'rb').read()).hexdigest() for rel in sorted(uploaded)}}
    with open(os.path.join(ROOT, 'tools/deploy-plan.json'), 'w') as fh:
        json.dump(plan, fh, ensure_ascii=False, separators=(',', ':'))
    cfg = json.load(open(os.path.join(ROOT, 'vercel.json')))
    cfg.update({'buildCommand': 'node tools/build.mjs', 'outputDirectory': 'dist', 'installCommand': ''})
    files = [{'file': 'vercel.json', 'data': json.dumps(cfg, indent=2, ensure_ascii=False) + '\n', 'encoding': 'utf-8'}]
    cache_path = os.path.join(ROOT, 'tools/uploaded.json')
    cache = json.load(open(cache_path)) if os.path.exists(cache_path) else {}
    for rel in ['tools/build.mjs', 'tools/deploy-plan.json'] + sorted(uploaded):
        data = open(os.path.join(ROOT, rel), 'rb').read()
        sha = hashlib.sha1(data).hexdigest()
        if cache.get(rel) == sha:
            files.append({'file': rel, 'sha': sha, 'size': len(data)})
        else:
            try:
                files.append({'file': rel, 'data': data.decode('utf-8'), 'encoding': 'utf-8'})
            except UnicodeDecodeError:
                files.append({'file': rel, 'data': __import__('base64').b64encode(data).decode(), 'encoding': 'base64'})
    os.makedirs(outdir, exist_ok=True)
    with open(os.path.join(outdir, 'deploy-files.json'), 'w') as fh:
        json.dump(files, fh, ensure_ascii=False)
    inline = sum(len(f.get('data', '')) for f in files)
    print(f'patches={len(patches)} uploaded={len(uploaded)} removed={len(removed)} inline_chars={inline}')
    for f in files:
        print(' ', f['file'], 'sha' if 'sha' in f else len(f['data']))


if __name__ == '__main__':
    main()
