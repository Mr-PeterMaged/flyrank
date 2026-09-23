"""Verify web packaging in isolated temporary directories, without reading datasets."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [ROOT, *(ROOT / name for name in (
    "portfolio", "paper", "todo-api", "background-job", "pdf-report-generator", "scraper"
))]

for target in TARGETS:
    manifest = json.loads((target / "deployment.json").read_text())
    with tempfile.TemporaryDirectory(prefix="peter-web-verify-") as directory:
        temporary = Path(directory).resolve()
        assert temporary.parent == Path(tempfile.gettempdir()).resolve()
        shutil.copy(target / "deployment.json", temporary)
        (temporary / "scripts").mkdir()
        shutil.copy(target / "scripts/build-vercel.mjs", temporary / "scripts")
        for source, _ in manifest["assets"]:
            dest = temporary / source
            dest.parent.mkdir(parents=True, exist_ok=True)
            if (target / source).is_dir():
                shutil.copytree(target / source, dest)
            else:
                shutil.copy(target / source, dest)
        env = {key: value for key, value in os.environ.items() if key != "BACKEND_ORIGIN"}
        command = ["node", "scripts/build-vercel.mjs"]
        if manifest["backend"]:
            for value in (None, "http://backend.example.com", "https://backend.example.com/path"):
                test_env = dict(env)
                if value:
                    test_env["BACKEND_ORIGIN"] = value
                result = subprocess.run(command, cwd=temporary, env=test_env, capture_output=True)
                assert result.returncode != 0, "Invalid origin must fail the build"
            env["BACKEND_ORIGIN"] = "https://backend.example.com"
        subprocess.run(command, cwd=temporary, env=env, check=True, capture_output=True)
        output = temporary / ".vercel/output"
        config = json.loads((output / "config.json").read_text())
        assert config["version"] == 3
        routes = config["routes"]
        assert any(route.get("handle") == "filesystem" for route in routes)
        if manifest["backend"]:
            assert routes[-1]["dest"] == "https://backend.example.com/$1"
            assert routes[-1]["headers"]["Cache-Control"] == "private, no-store"
        for page in (output / "static").rglob("*.html"):
            content = page.read_text(encoding="utf-8")
            assert 'href="https://petermaged.com/"' in content
            assert "© 2026 PeterMaged. All rights reserved." in content
        assert not any(p.suffix in {".py", ".db", ".sqlite", ".md"} for p in (output / "static").rglob("*"))
        # Repeat builds must refuse stale output, never silently publish old assets.
        result = subprocess.run(command, cwd=temporary, env=env, capture_output=True)
        assert result.returncode != 0
    print(f"PASS {target.relative_to(ROOT) or '.'}: assets, routes, credits, configuration guards")

print("Seven deployment targets verified. No datasets or external services accessed.")
