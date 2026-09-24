import mcp_server


def test_package_exposes_a_version() -> None:
    assert mcp_server.__version__ == "0.1.0"
