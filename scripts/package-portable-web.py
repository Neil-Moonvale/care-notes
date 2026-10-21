"""Package source-tracked browser assets; no server relay or credentials."""
import hashlib
import json
import re
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parents[1]
version = json.loads((root / 'package.json').read_text())['version']
assert re.fullmatch(r'\d+\.\d+\.\d+', version), 'Invalid release version'
output = root / 'build' / 'portable'
output.mkdir(parents=True, exist_ok=True)
package = output / f'Care-Notes-{version}-web.zip'
assets = sorted(p for p in (root / 'dist').iterdir()
                if p.is_file() and not p.is_symlink()
                and p.suffix in {'.html', '.js', '.css', '.svg', '.webmanifest'})
with ZipFile(package, 'w', ZIP_DEFLATED) as archive:
    for asset in assets:
        archive.write(asset, asset.name)
    archive.write(root / 'LICENSE', 'LICENSE')
    archive.writestr('START-HERE.txt', f'''Care Notes {version} portable web app

Extract and serve this folder, for example:
python3 -m http.server 8000 --bind 127.0.0.1
Open http://127.0.0.1:8000/?mode=demo
Do not open using file://.

Fictional examples, local recording and handoff checkpoints need no API key.
Model calls require Settings > direct transport and a provider allowing browser CORS.
This archive has no server relay. For the full local server, use the source archive
and follow README.md. This is not an Android APK.
''')
with ZipFile(package) as archive:
    assert archive.testzip() is None
    for asset in assets:
        assert archive.read(asset.name) == asset.read_bytes()
(output / 'SHA256SUMS-web.txt').write_text(
    hashlib.sha256(package.read_bytes()).hexdigest() + '  ' + package.name + '\n')
print(f'Verified {len(assets)} browser assets in {package.name}')
