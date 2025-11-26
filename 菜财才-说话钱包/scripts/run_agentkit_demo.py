"""
Demo script to exercise the AgentKit implemented in the repository.
"""

from agents.agentkit import AgentKit, OnChainActionProvider, OffChainActionProvider
from mcp_servers.agent_server import AgentMCPServer
import threading
import time
import uvicorn


def demo():
    kit = AgentKit("demo_key", "0xdeadbeef", "https://rpc.example")
    onchain = OnChainActionProvider("main_onchain", kit.cdp)
    kit.load_provider(onchain)

    def hello_handler(name="world"):
        return {"greeting": f"hello {name}"}

    offchain = OffChainActionProvider("main_offchain")
    offchain.register_handler("hello", hello_handler)
    kit.load_provider(offchain)

    # Start MCP server in background thread - non-blocking for demo
    mcp = AgentMCPServer(kit)

    def _run_mcp():
        uvicorn.run(mcp.app, host="127.0.0.1", port=8000, log_level="info")

    thread = threading.Thread(target=_run_mcp, daemon=True)
    thread.start()
    time.sleep(0.6)  # allow server to start briefly

    # Register the MCP URL as a tool on the agent kit - direct register
    kit.register_url_tool("mcp_tool", "http://127.0.0.1:8000")
    # Also demonstrate decorator-style registration for a remote URL tool
    kit.tool(name="mcp_tool_via_deco", url="http://127.0.0.1:8000")

    # Call the tool which will dispatch to the MCP server
    res = kit.perform_tool("mcp_tool", provider="main_offchain", action="hello", params={"name": "AgentKit via MCP"})
    print("Tool call response:", res)
    res2 = kit.perform_tool("mcp_tool_via_deco", provider="main_offchain", action="hello", params={"name": "AgentKit via MCP (decorator)"})
    print("Tool decorator call response:", res2)

    print("Providers:", list(kit._providers.keys()))
    print("On-chain info:", kit.perform("main_onchain", "get_chain_info"))
    print("Off-chain hello:", kit.perform("main_offchain", "hello", name="AgentKit"))


if __name__ == "__main__":
    demo()
