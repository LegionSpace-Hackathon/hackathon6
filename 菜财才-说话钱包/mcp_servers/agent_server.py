"""
Minimal MCP HTTP server that wraps an instance of AgentKit and exposes its providers/actions.
This server uses FastAPI and can be run via uvicorn.

Endpoints:
- GET /mcp/info -> basic info including provider names and CDP info
- POST /mcp/perform -> JSON body with provider, action, params -> execute using AgentKit
"""
from __future__ import annotations

import logging
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from agents.agentkit import AgentKit

_logger = logging.getLogger(__name__)


class PerformRequest(BaseModel):
    provider: str
    action: str
    params: Dict[str, Any] = {}


class AgentMCPServer:
    def __init__(self, kit: AgentKit):
        self.kit = kit
        self.app = FastAPI(title="AgentKit MCP Server")

        @self.app.get("/mcp/info")
        def info():
            return {
                "providers": list(self.kit._providers.keys()),
                "cdp": self.kit.cdp.info(),
            }

        @self.app.post("/mcp/perform")
        def perform(req: PerformRequest):
            try:
                result = self.kit.perform(req.provider, req.action, **req.params)
                return {"ok": True, "result": result}
            except Exception as e:
                _logger.exception("Perform failed: %s", e)
                raise HTTPException(status_code=400, detail=str(e))


__all__ = ["AgentMCPServer"]
