from mcp_server.server import create_mcp_server


def main() -> None:
    create_mcp_server().run("stdio")


def http() -> None:
    import uvicorn

    from mcp_server.config import HttpSettings
    from mcp_server.http_app import create_http_app

    settings = HttpSettings.from_env()
    # Behind nginx: trust its X-Forwarded-* so the app sees https and the public host.
    uvicorn.run(
        create_http_app(settings),
        host="0.0.0.0",
        port=settings.port,
        proxy_headers=True,
        forwarded_allow_ips="*",
    )


if __name__ == "__main__":
    main()
