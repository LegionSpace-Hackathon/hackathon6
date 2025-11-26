"""
MCP Server: expose providers and actions over HTTP.

This is a small FastAPI-based implementation that supports:
- Registering providers (by name)
- Dispatching actions to providers
- API key header validation
- Starting and stopping the server from code

This is intentionally lightweight for local/integration tests.
"""
from __future__ import annotations

import logging
import threading
import socket
import time
from typing import Dict, Any, Callable, Optional

from fastapi import FastAPI, HTTPException, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn

_logger = logging.getLogger(__name__)


class ProviderActionRequest(BaseModel):
    action: str
    args: Dict[str, Any] = {}


class MCPServerBase:
    def __init__(self, api_key: Optional[str] = None):
        self.app = FastAPI()
        self._providers: Dict[str, Callable[[str, Dict[str, Any]], Any]] = {}
        self._api_key = api_key
        self._server_thread: Optional[threading.Thread] = None
        self._uvicorn_server: Optional[uvicorn.Server] = None
        self._host = "127.0.0.1"
        self._port = None

        # endpoints
        @self.app.get("/health")
        async def health():
            return {"status": "ok"}

        @self.app.get("/providers")
        async def list_providers(x_api_key: Optional[str] = Header(None)):
            self._check_api_key(x_api_key)
            return {"providers": list(self._providers.keys())}

        @self.app.post("/providers/{provider_name}/actions")
        async def dispatch_action(provider_name: str, req: ProviderActionRequest, x_api_key: Optional[str] = Header(None)):
            self._check_api_key(x_api_key)
            if provider_name not in self._providers:
                raise HTTPException(status_code=404, detail=f"Provider not found: {provider_name}")
            func = self._providers[provider_name]
            try:
                result = func(req.action, **req.args)
                return JSONResponse({"status": "ok", "result": result})
            except Exception as e:
                _logger.exception("Provider action raised error")
                raise HTTPException(status_code=500, detail=str(e))

    def _check_api_key(self, provided: Optional[str]):
        if self._api_key is None:
            return
        if provided is None or provided != self._api_key:
            raise HTTPException(status_code=401, detail="Invalid API Key")

    def register_provider(self, name: str, func: Callable[[str, Dict[str, Any]], Any]):
        """Register a function that handles (action, **kwargs) for the provider."""
        _logger.info("Registering provider %s", name)
        self._providers[name] = func

    def unregister_provider(self, name: str):
        if name in self._providers:
            del self._providers[name]

    def get_bindable_port(self) -> int:
        """Pick a free port to bind uvicorn to (non-conflicting)."""
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind((self._host, 0))
            return s.getsockname()[1]

    def start(self, host: Optional[str] = None, port: Optional[int] = None):
        """Start the uvicorn server in a background thread.

        Returns the URL string of the server.
        """
        if host:
            self._host = host
        if port is None:
            port = self.get_bindable_port()
        self._port = port

        config = uvicorn.Config(app=self.app, host=self._host, port=self._port, log_level="info")
        server = uvicorn.Server(config)
        self._uvicorn_server = server

        def run_server():
            server.run()

        t = threading.Thread(target=run_server, daemon=True)
        t.start()
        self._server_thread = t

        # Wait for server to start. Use small polling with timeout.
        for _ in range(50):
            try:
                import requests

                r = requests.get(f"http://{self._host}:{self._port}/health")
                if r.status_code == 200:
                    break
            except Exception:
                time.sleep(0.05)
        _logger.info("MCP server started at http://%s:%s", self._host, self._port)
        return f"http://{self._host}:{self._port}"

    def stop(self):
        if self._uvicorn_server is not None and self._uvicorn_server.should_exit is False:
            _logger.info("Stopping MCP server")
            self._uvicorn_server.should_exit = True
        if self._server_thread:
            self._server_thread.join(timeout=2)


__all__ = ["MCPServerBase", "ProviderActionRequest"]
import logging
from abc import ABC, abtractmethod
from typing import List,Dict,Any,Optional
from mcp import Server,Tool,Resource
from pydantic import BaseModel,Field
import asyncio