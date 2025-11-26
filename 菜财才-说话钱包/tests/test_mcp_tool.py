from agents.agentkit import AgentKit, OffChainActionProvider
from mcp_servers.agent_server import AgentMCPServer
from fastapi.testclient import TestClient
import requests


def test_mcp_server_and_url_tool(monkeypatch):
    kit = AgentKit("k3", "0x42", "https://rpc.example")
    off = OffChainActionProvider("off")
    off.register_handler("echo", lambda message: {"echo": message})
    kit.load_provider(off)

    mcp = AgentMCPServer(kit)
    client = TestClient(mcp.app)

    # sanity check: info endpoint
    r = client.get("/mcp/info")
    assert r.status_code == 200
    j = r.json()
    assert "providers" in j and "off" in j["providers"]

    # Test perform endpoint
    payload = {"provider": "off", "action": "echo", "params": {"message": "hello"}}
    r2 = client.post("/mcp/perform", json=payload)
    assert r2.status_code == 200
    assert r2.json()["result"]["echo"] == "hello"

    # Register the remote URL tool (we'll make requests.post call the test client)
    kit.register_url_tool("mcp_tool", "http://127.0.0.1:8000")

    def fake_post(url, json, timeout):
        # forward to TestClient ignoring host
        path = url.replace("http://127.0.0.1:8000", "")
        r = client.post(path, json=json)
        class Resp:
            def __init__(self, r):
                self._r = r
            def raise_for_status(self):
                if self._r.status_code >= 400:
                    raise requests.HTTPError(f"HTTP {self._r.status_code}")
            def json(self):
                return self._r.json()
        return Resp(r)

    monkeypatch.setattr(requests, "post", fake_post)

    # perform remote tool call
    res = kit.perform_tool("mcp_tool", provider="off", action="echo", params={"message": "via tool"})
    assert res["result"]["echo"] == "via tool"
