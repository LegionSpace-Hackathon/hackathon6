import os
import pytest
from agents.agentkit import AgentKit, OnChainActionProvider, OffChainActionProvider


def test_agentkit_basic_flow(tmp_path, monkeypatch):
    # Setup env
    env = {
        "CDP_API_KEY_NAME": "testing_key",
        "CDP_PRIVATE_KEY": "0x1234",
        "CDP_ENDPOINT": "https://rpc.example"
    }

    kit = AgentKit(env["CDP_API_KEY_NAME"], env["CDP_PRIVATE_KEY"], env["CDP_ENDPOINT"])

    assert kit.cdp.api_key_name == "testing_key"
    assert kit.cdp.endpoint == "https://rpc.example"

    onchain = OnChainActionProvider("oc", kit.cdp)
    kit.load_provider(onchain)
    assert kit.get_provider("oc") is onchain

    r = kit.perform("oc", "get_chain_info")
    assert r["api_key_name"] == "testing_key"

    offchain = OffChainActionProvider("off")
    offchain.register_handler("sum", lambda a=0, b=0: a + b)
    kit.load_provider(offchain)
    assert kit.perform("off", "sum", a=1, b=2) == 3


def test_onchain_send_tx_signature_format():
    kit = AgentKit("k2", "0xdead", "https://rpc.example")
    onchain = OnChainActionProvider("oc2", kit.cdp)
    kit.load_provider(onchain)
    tx = {"to": "0xabc", "value": 123}
    r = kit.perform("oc2", "send_transaction", tx=tx)
    assert isinstance(r, dict) and "tx_hash" in r


def test_onchain_transfer_swap_init_and_mcp_tool(tmp_path):
    kit = AgentKit("k3", "0xbeef", "https://rpc.example")
    oc = OnChainActionProvider("onchain", kit.cdp)
    kit.load_provider(oc)

    # init a balance
    res_init = kit.perform("onchain", "init", address="0x1", balances={"ETH": 100})
    assert res_init["balances"]["ETH"] == 100

    # transfer
    res_tr = kit.perform("onchain", "transfer", **{"from": "0x1", "to": "0x2", "amount": 30, "token": "ETH"})
    assert res_tr["amount"] == 30

    # swap
    kit.perform("onchain", "init", address="0x2", balances={"USDC": 0})
    res_swap = kit.perform("onchain", "swap", address="0x2", from_token="ETH", to_token="USDC", amount=10)
    assert res_swap["amount"] == 10

    # start MCP server and register remote tool
    base = kit.start_mcp_server(host="127.0.0.1")
    assert base.startswith("http://")

    # perform via tool (mcp is automatically registered)
    r_tool = kit.perform_tool("mcp", provider="onchain", action="get_chain_info", params={})
    assert isinstance(r_tool, dict)

    # cleanup
    kit.stop_mcp_server()
