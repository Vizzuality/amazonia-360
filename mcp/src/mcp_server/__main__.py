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


def chat() -> None:
    import os

    import uvicorn

    from mcp_server.chat.app import ChatService, create_chat_app
    from mcp_server.chat.settings import ChatSettings

    settings = ChatSettings.from_env()
    service = ChatService(settings, create_mcp_server())
    uvicorn.run(
        create_chat_app(service, settings),
        host="127.0.0.1",
        port=int(os.environ.get("MCP_CHAT_PORT", "8001")),
    )


if __name__ == "__main__":
    main()
