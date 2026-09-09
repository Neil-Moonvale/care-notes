"""Preserve verified APK bytes and match bundled app files before publishing.

Signature verification is performed during signing. This checks the published
checksum and prevents shipping different web and Android app implementations.
"""
import argparse
import hashlib
import json
import shutil
from pathlib import Path
from zipfile import ZipFile

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--web-output')
args = parser.parse_args()
version = json.loads((root / 'package.json').read_text())['version']
name = f'Care-Notes-{version}.apk'
apk = root / 'downloads' / name
digest, checksum_name = (root / 'downloads/SHA256SUMS').read_text().strip().split()
assert checksum_name == name, 'Distribution version and checksum filename differ'
assert hashlib.sha256(apk.read_bytes()).hexdigest() == digest, 'APK checksum mismatch'
allowed = {'.html', '.js', '.css', '.svg', '.webmanifest'}
web = {p.name: p for p in (root / 'dist').iterdir()
       if p.is_file() and not p.is_symlink() and p.suffix in allowed}
bundled = {name: p for name, p in web.items() if name != 'sw.js'}
with ZipFile(apk) as archive:
    assert len(archive.namelist()) == len(set(archive.namelist())), 'Duplicate ZIP entries'
    assert {'classes.dex', 'AndroidManifest.xml'} <= set(archive.namelist()), 'Incomplete APK'
    entries = {name for name in archive.namelist() if name.startswith('assets/')}
    assert entries == {'assets/' + name for name in bundled}, 'APK asset inventory mismatch'
    for name, source in bundled.items():
        assert archive.read('assets/' + name) == source.read_bytes(), f'APK differs: {name}'
if args.web_output:
    output = (root / args.web_output).resolve()
    assert output.is_relative_to(root / 'build'), 'Web staging must be under build/'
    assert output != root / 'build', 'Use a dedicated staging directory'
    output.mkdir(parents=True, exist_ok=True)
    assert not any(output.iterdir()), 'Refusing to overwrite nonempty staging'
    for name, source in web.items():
        shutil.copyfile(source, output / name)
print(json.dumps({'version': version, 'apk_bytes': apk.stat().st_size,
                  'sha256': digest, 'matching_bundled_files': len(bundled),
                  'web_files': len(web)}))
