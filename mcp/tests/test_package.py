import tomllib
from pathlib import Path

import mcp_server


def test_the_package_version_is_the_project_version() -> None:
    pyproject = Path(__file__).parents[1] / "pyproject.toml"
    project = tomllib.loads(pyproject.read_text())["project"]
    assert mcp_server.__version__ == project["version"]
