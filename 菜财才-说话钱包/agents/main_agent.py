"""
Main agent entry script that constructs AgentKit, registers providers, and demonstrates actions.
"""

from __future__ import annotations

import logging
from agents.agentkit import AgentKit, OnChainActionProvider, OffChainActionProvider
from mcp_servers.agent_server import AgentMCPServer
import threading
import time
import uvicorn

logging.basicConfig(level=logging.INFO)
_logger = logging.getLogger(__name__)


def create_agentkit_from_env(env: dict | None = None) -> AgentKit:
    """Construct AgentKit using environment dict or defaults.

    The CDP configuration expects the following keys:
      - CDP_API_KEY_NAME
      - CDP_PRIVATE_KEY
      - CDP_ENDPOINT (optional)
    """
    if env is None:
        import os

        env = os.environ
    api_key_name = env.get("CDP_API_KEY_NAME", "sample_api_key")
    private_key = env.get("CDP_PRIVATE_KEY", "0xdeadbeef0123456789")
    endpoint = env.get("CDP_ENDPOINT", None)
    kit = AgentKit(api_key_name, private_key, endpoint)

    # Load a default on-chain provider
    onchain = OnChainActionProvider("main_onchain", kit.cdp)
    kit.load_provider(onchain)

    # Load a default off-chain provider with a sample handler
    offchain = OffChainActionProvider("main_offchain")

    def echo_handler(message: str = "") -> dict:
        _logger.info("Echo handler called with: %s", message)
        return {"echo": message}

    offchain.register_handler("echo", echo_handler)
    kit.load_provider(offchain)

    return kit


def main() -> None:
    kit = create_agentkit_from_env()
    _logger.info("Available providers: %s", list(kit._providers.keys()))

    # Example on-chain action
    result = kit.perform("main_onchain", "get_chain_info")
    _logger.info("on-chain get_chain_info result: %s", result)

    # Example off-chain action
    r2 = kit.perform("main_offchain", "echo", message="Hello AgentKit")
    _logger.info("off-chain echo result: %s", r2)

    # Start MCP server if requested via env
    import os
    if os.environ.get("START_MCP_SERVER", "false").lower() in ("1", "true", "yes"):
        mcp = AgentMCPServer(kit)

        def _run():
            uvicorn.run(mcp.app, host="127.0.0.1", port=8000, log_level="info")

        t = threading.Thread(target=_run, daemon=True)
        t.start()
        time.sleep(0.2)
        # register the url as a tool on kit
        kit.register_url_tool("mcp_tool", "http://127.0.0.1:8000")
        _logger.info("MCP server started and registered as tool 'mcp_tool'")


if __name__ == "__main__":
    main()
