"""
AgentKit: a simple agent runtime kit to manage CDP connections and Action Providers.

This module provides:
- CDPConnection: a small wrapper that stores API key name, private key, and an RPC endpoint URL.
- ActionProvider: base class for providers (off-chain or on-chain)
- OnChainActionProvider: simple web3-like action provider (simulated) that uses RPC + private key to "send" transactions
- OffChainActionProvider: sample provider that performs off-chain tasks (HTTP or local actions)
- AgentKit: high-level class that manages CDP connection and registered providers and exposes a run_action API.

This implementation is deliberately lightweight and dependency-free; where cryptographic signing is needed, the code simulates a signing operation unless `eth_account` or `web3` is installed.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, Callable, Optional
import requests

_logger = logging.getLogger(__name__)


@dataclass
class CDPConnection:
    """Representation of a CDP connection.

    - api_key_name: friendly name for the key (to check against allowed names)
    - private_key: a hex-encoded private key or any key representation for signing
    - endpoint: optional RPC/API endpoint for the CDP provider
    """

    api_key_name: str
    private_key: str
    endpoint: Optional[str] = None

    def sign_message(self, message: bytes) -> str:
        """Simulate signing or use eth-account/web3 if available.

        Returns a hex-encoded signature.
        """
        try:
            # Try to use eth_account if available.
            from eth_account import Account  # type: ignore

            acct = Account.from_key(self.private_key)
            signed = acct.sign_message(
                # use minimal EIP-191 like sign
                Account.sign_message.__annotations__.get('message', None) or message
            )
            # `signed` might not be the same shape; fallback to simple simulated signature
            return signed.signature.hex()
        except Exception:
            # fallback: return a fake signature (hash)
            import hashlib

            sig = hashlib.sha256(self.private_key.encode() + message).hexdigest()
            return "0x" + sig

    def info(self) -> Dict[str, Any]:
        return {
            "api_key_name": self.api_key_name,
            "endpoint": self.endpoint,
            "connected": bool(self.endpoint),
        }


class ActionProvider:
    """Base class for action providers.

    Providers implement `perform` which will execute a named action with provided kwargs.
    """

    def __init__(self, name: str):
        self.name = name

    def perform(self, action: str, **kwargs) -> Any:
        raise NotImplementedError("ActionProvider.perform must be implemented by subclasses")


class OnChainActionProvider(ActionProvider):
    """A minimal on-chain action provider that can (hypothetically) send transactions.

    In a real environment, this provider would use `web3` (e.g., Web3 HTTPProvider) and a real key
    (private_key) through a signer to send transactions. Here we simulate behavior for example.
    """

    def __init__(self, name: str, cdp: CDPConnection):
        super().__init__(name)
        self.cdp = cdp
        # store balances for addresses to simulate transfers/swaps
        self._balances: Dict[str, Dict[str, float]] = {}

    def perform(self, action: str, **kwargs) -> Dict[str, Any]:
        _logger.debug("OnChainActionProvider.perform action=%s kwargs=%s", action, kwargs)
        if action == "send_transaction":
            tx_payload = kwargs.get("tx", {})
            # Simulate signing
            raw = str(tx_payload).encode()
            sig = self.cdp.sign_message(raw)
            # Simulate tx hash
            import hashlib

            tx_hash = hashlib.sha256(raw + sig.encode()).hexdigest()
            return {"status": "ok", "tx_hash": "0x" + tx_hash}
        elif action == "get_chain_info":
            return {"chain_endpoint": self.cdp.endpoint, "api_key_name": self.cdp.api_key_name}
        elif action == "transfer":
            from_addr = kwargs.get("from")
            to_addr = kwargs.get("to")
            amount = float(kwargs.get("amount", 0))
            token = kwargs.get("token", "ETH")
            if not (from_addr and to_addr):
                raise ValueError("transfer requires from and to addresses")
            # default balances
            self._balances.setdefault(from_addr, {}).setdefault(token, 0.0)
            self._balances.setdefault(to_addr, {}).setdefault(token, 0.0)
            if self._balances[from_addr][token] < amount:
                raise ValueError("insufficient balance")
            self._balances[from_addr][token] -= amount
            self._balances[to_addr][token] += amount
            return {"status": "ok", "from": from_addr, "to": to_addr, "token": token, "amount": amount}
        elif action == "swap":
            addr = kwargs.get("address")
            from_token = kwargs.get("from_token")
            to_token = kwargs.get("to_token")
            amount = float(kwargs.get("amount", 0))
            if not addr or not from_token or not to_token:
                raise ValueError("swap requires address, from_token and to_token")
            self._balances.setdefault(addr, {}).setdefault(from_token, 0.0)
            self._balances.setdefault(addr, {}).setdefault(to_token, 0.0)
            if self._balances[addr][from_token] < amount:
                raise ValueError("insufficient balance for swap")
            # naive 1:1 swap for example
            self._balances[addr][from_token] -= amount
            self._balances[addr][to_token] += amount
            return {"status": "ok", "address": addr, "from_token": from_token, "to_token": to_token, "amount": amount}
        elif action == "init":
            addr = kwargs.get("address")
            balances = kwargs.get("balances", {})
            if not addr:
                raise ValueError("init requires address")
            self._balances.setdefault(addr, {})
            for t, a in (balances or {}).items():
                self._balances[addr].setdefault(t, 0.0)
                self._balances[addr][t] += float(a)
            return {"status": "ok", "address": addr, "balances": self._balances[addr]}
        else:
            raise ValueError(f"Unknown on-chain action: {action}")


class OffChainActionProvider(ActionProvider):
    """Off-chain provider for non-blockchain actions like HTTP calls or database operations.

    This provider uses simple 'handlers' to map action names to callables for flexibility.
    """

    def __init__(self, name: str):
        super().__init__(name)
        self._handlers: Dict[str, Callable[..., Any]] = {}

    def register_handler(self, action_name: str, handler: Callable[..., Any]):
        self._handlers[action_name] = handler

    def perform(self, action: str, **kwargs) -> Any:
        _logger.debug("OffChainActionProvider.perform action=%s kwargs=%s", action, kwargs)
        if action not in self._handlers:
            raise ValueError(f"Unknown off-chain action: {action}")
        handler = self._handlers[action]
        return handler(**kwargs)


class AgentKit:
    """High-level AgentKit to manage CDP connection and action providers.

    Usage:
        kit = AgentKit(cdp_api_key_name='mykey', cdp_private_key='0xabc', cdp_endpoint='https://rpc')
        kit.load_provider(OnChainActionProvider('main_onchain', kit.cdp))
        kit.perform('main_onchain', 'send_transaction', tx={...})
    """

    def __init__(self, cdp_api_key_name: str, cdp_private_key: str, cdp_endpoint: Optional[str] = None):
        self.cdp = CDPConnection(cdp_api_key_name, cdp_private_key, cdp_endpoint)
        self._providers: Dict[str, ActionProvider] = {}
        # Tools map - tools can be local functions or remote HTTP URL wrappers
        self._tools: Dict[str, Any] = {}
        _logger.info("AgentKit initialized with CDP: %s", self.cdp.info())

    def load_provider(self, provider: ActionProvider) -> None:
        if provider.name in self._providers:
            _logger.warning("Replacing provider %s", provider.name)
        self._providers[provider.name] = provider
        _logger.info("Loaded provider %s", provider.name)

    def unload_provider(self, provider_name: str) -> None:
        if provider_name in self._providers:
            del self._providers[provider_name]
            _logger.info("Unloaded provider %s", provider_name)

    def get_provider(self, name: str) -> Optional[ActionProvider]:
        return self._providers.get(name)

    def perform(self, provider_name: str, action: str, **kwargs) -> Any:
        provider = self.get_provider(provider_name)
        if provider is None:
            raise ValueError(f"Provider not registered: {provider_name}")
        return provider.perform(action, **kwargs)

    # ---- Tool support ----
    def register_local_tool(self, name: str, func: Callable[..., Any]):
        """Registers a local python function as a tool invocation.

        Later, `perform_tool` can call it with kwargs and return the result.
        """
        if name in self._tools:
            _logger.warning("Replacing tool %s", name)
        self._tools[name] = {"type": "local", "callable": func}

    def register_url_tool(self, name: str, mcp_base_url: str):
        """Registers a remote tool via HTTP to the MCP server base URL.

        The remote server is expected to expose a `/mcp/perform` endpoint as in this
        repo's `mcp_servers.agent_server.AgentMCPServer`.
        """
        if name in self._tools:
            _logger.warning("Replacing tool %s", name)
        self._tools[name] = {"type": "url", "url": mcp_base_url.rstrip('/'), "api_key": None}

    def get_tool(self, name: str) -> Optional[Any]:
        return self._tools.get(name)

    def register_url_tool_with_api_key(self, name: str, mcp_base_url: str, api_key: Optional[str] = None):
        """Register a remote tool with API key for authenticated MCP servers."""
        if name in self._tools:
            _logger.warning("Replacing tool %s", name)
        self._tools[name] = {"type": "url", "url": mcp_base_url.rstrip('/'), "api_key": api_key}

    def tool(self, name: Optional[str] = None, url: Optional[str] = None):
        """Decorator to register a function as a local tool, or to register a URL-based tool.

        Examples:
            @kit.tool("hello_tool")
            def hello(...): ...

            # or register a URL tool:
            kit.tool(name="remote_tool", url="http://127.0.0.1:8000")
        """
        if url is not None and name is not None:
            # Register remote tool directly
            self.register_url_tool(name, url)
            def _noop(f):
                return f
            return _noop

        def _decorator(func: Callable[..., Any]):
            nm = name or getattr(func, "__name__", None)
            if not nm:
                raise ValueError("Tool name required or provide a function with a name")
            self.register_local_tool(nm, func)
            return func

        return _decorator

    def perform_tool(self, name: str, provider: str, action: str, params: Dict[str, Any] = {}):
        """Perform a tool invocation. If the tool is local, call the function.
        If tool is remote, call MCP `/mcp/perform` to execute.
        """
        tool = self.get_tool(name)
        if tool is None:
            raise ValueError(f"Tool not registered: {name}")
        if tool["type"] == "local":
            func = tool["callable"]
            return func(provider=provider, action=action, params=params)
        elif tool["type"] == "url":
            # POST /mcp/perform
            url = tool["url"].rstrip('/') + '/mcp/perform'
            payload = {"provider": provider, "action": action, "params": params}
            headers = {}
            if tool.get("api_key"):
                headers["x-api-key"] = tool.get("api_key")
            resp = requests.post(url, json=payload, timeout=15, headers=headers)
            resp.raise_for_status()
            return resp.json()
        else:
            raise ValueError("Unknown tool type")

    # ---- MCP server integration ----
    def start_mcp_server(self, host: str = "127.0.0.1", port: Optional[int] = None, api_key: Optional[str] = None) -> str:
        """Start an MCP server that exposes this AgentKit's providers and actions.

        Returns the base URL of the server (e.g. http://127.0.0.1:8000)
        """
        from mcp_servers.agent_server import AgentMCPServer
        import uvicorn
        import socket
        import threading

        # choose a free port if none provided
        if port is None:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind((host, 0))
                port = s.getsockname()[1]

        # create AgentMCPServer ASGI app
        agent_app = AgentMCPServer(self).app

        config = uvicorn.Config(app=agent_app, host=host, port=port, log_level="info")
        server = uvicorn.Server(config)

        def _run():
            server.run()

        t = threading.Thread(target=_run, daemon=True)
        t.start()

        # wait for server to start
        import time
        import requests
        base = f"http://{host}:{port}"
        for _ in range(40):
            try:
                r = requests.get(base + "/mcp/info", timeout=0.5)
                if r.status_code == 200:
                    break
            except Exception:
                time.sleep(0.05)

        # register remote tool wrapper
        self.register_url_tool_with_api_key("mcp", base, api_key=api_key)
        self._mcp_server = server
        self._mcp_thread = t
        self._mcp_base_url = base
        return base

    def stop_mcp_server(self):
        if getattr(self, "_mcp_server", None) is not None:
            try:
                self._mcp_server.should_exit = True
            except Exception:
                pass


__all__ = ["CDPConnection", "ActionProvider", "OnChainActionProvider", "OffChainActionProvider", "AgentKit"]
