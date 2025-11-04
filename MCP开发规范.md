# LegionSpace Hackathon MCP开发规范

## 🎯 概述

本文档为LegionSpace Hackathon提供MCP（Model Context Protocol）开发规范，旨在帮助参赛者构建高质量、可互操作的MCP服务器。所有代码示例均使用Python。

## 📋 基础要求

### 1. 开发环境配置

```python
# requirements.txt 基础依赖
mcp>=1.0.0
pydantic>=2.0.0
fastapi>=0.100.0
uvicorn>=0.20.0
httpx>=0.24.0
python-dotenv>=1.0.0
asyncio>=3.9.0

# 赛道特定依赖参考
# 赛道一：多智能体协同
networkx>=3.0  # 用于任务图分析
# 赛道二：身份与记忆
chromadb>=0.4.0  # 向量数据库
# 赛道三：Agent经济
web3>=6.0.0  # 区块链交互
```

### 2. 项目结构规范

```python
"""
推荐的项目结构：
hackathon-project/
├── mcp_servers/
│   ├── __init__.py
│   ├── base_server.py          # 基础服务器类
│   └── task_coordinator/       # 示例
│       ├── __init__.py
│       ├── server.py
│       └── models.py
├── agents/
│   ├── __init__.py
│   └── main_agent.py           # 主智能体
├── tests/
│   ├── __init__.py
│   ├── test_memory_manager.py
│   └── test_payment_gateway.py
├── config/
│   └── settings.py            # 配置管理
├── docs/
│   └── MCP_INTEGRATION.md     # MCP集成说明文档
├── .env.example               # 环境变量示例
├── requirements.txt
└── README.md
"""
```

## 🛠 MCP服务器开发规范

### 1. 基础服务器模板

```python
# mcp_servers/base_server.py
import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from mcp import Server, Tool, Resource
from pydantic import BaseModel, Field
import asyncio

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MCPServerBase(ABC):
    """MCP服务器抽象基类"""
    
    def __init__(self, server_name: str, version: str = "1.0.0"):
        self.server_name = server_name
        self.version = version
        self.server = Server(self.server_name)
        self._register_tools()
        
    def _register_tools(self):
        """注册所有工具到服务器"""
        for tool in self.get_tools():
            self.server.tool()(tool)
    
    @abstractmethod
    def get_tools(self) -> List[Tool]:
        """返回服务器提供的工具列表 - 子类必须实现"""
        pass
    
    def get_resources(self) -> List[Resource]:
        """返回服务器提供的资源列表 - 可选实现"""
        return []
    
    async def run(self, host: str = "0.0.0.0", port: int = 8000):
        """运行MCP服务器"""
        logger.info(f"启动 {self.server_name} 服务器 v{self.version}")
        logger.info(f"监听地址: {host}:{port}")
        
        try:
            # 在实际实现中，这里会启动HTTP服务器或STDIO服务器
            await self.server.run()
        except Exception as e:
            logger.error(f"服务器运行错误: {str(e)}")
            raise
    
    async def health_check(self) -> Dict[str, Any]:
        """健康检查端点"""
        return {
            "status": "healthy",
            "server": self.server_name,
            "version": self.version,
            "tools_count": len(self.get_tools())
        }
```

### 2. 工具设计规范

```python
# mcp_servers/models.py
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from enum import Enum
import re

class MemoryType(str, Enum):
    CONVERSATION = "conversation"
    PREFERENCE = "preference" 
    FACT = "fact"
    EXPERIENCE = "experience"
    GOAL = "goal"

class SaveMemoryRequest(BaseModel):
    entity_id: str = Field(..., min_length=1, description="实体标识符")
    content: str = Field(..., min_length=1, max_length=10000, description="记忆内容")
    memory_type: MemoryType = Field(MemoryType.CONVERSATION, description="记忆类型")
    importance: float = Field(1.0, ge=0.0, le=10.0, description="重要性权重")
    tags: List[str] = Field(default_factory=list, description="标签列表")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="元数据")
    
    @validator('entity_id')
    def validate_entity_id(cls, v):
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('实体ID只能包含字母、数字、下划线和连字符')
        return v

class MemoryResponse(BaseModel):
    memory_id: str
    status: str
    timestamp: str
    entity_id: str
    similarity_score: Optional[float] = None

class PaymentRequest(BaseModel):
    sender_did: str = Field(..., description="发送方去中心化身份")
    recipient_did: str = Field(..., description="接收方去中心化身份") 
    amount: float = Field(..., gt=0, le=1000000, description="支付金额")
    currency: str = Field("x402", description="货币类型")
    service_description: str = Field(..., description="服务描述")
    invoice_id: Optional[str] = Field(None, description="发票ID")
    
    @validator('sender_did', 'recipient_did')
    def validate_did_format(cls, v):
        if not v.startswith('did:'):
            raise ValueError('DID必须以did:开头')
        return v

class PaymentResponse(BaseModel):
    transaction_id: str
    status: str
    amount: float
    currency: str
    timestamp: str
    network_confirmation: Optional[str] = None
```

### 3. 错误处理规范

```python
# mcp_servers/exceptions.py
class MCPServerError(Exception):
    """MCP服务器基础异常"""
    
    def __init__(self, message: str, code: str = "INTERNAL_ERROR", details: Dict = None):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)

class ValidationError(MCPServerError):
    """输入验证错误"""
    def __init__(self, message: str, field: str = None):
        details = {"field": field} if field else {}
        super().__init__(message, "VALIDATION_ERROR", details)

class ResourceNotFoundError(MCPServerError):
    """资源未找到错误"""
    def __init__(self, resource_type: str, resource_id: str):
        super().__init__(
            f"{resource_type} '{resource_id}' 未找到",
            "RESOURCE_NOT_FOUND",
            {"resource_type": resource_type, "resource_id": resource_id}
        )

class PaymentError(MCPServerError):
    """支付处理错误"""
    def __init__(self, message: str, reason: str = None):
        details = {"reason": reason} if reason else {}
        super().__init__(message, "PAYMENT_ERROR", details)

# 错误处理装饰器
def handle_mcp_errors(func):
    """统一错误处理装饰器"""
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except MCPServerError as e:
            logger.warning(f"业务逻辑错误: {e.code} - {e.message}")
            # 返回结构化错误信息
            return {
                "status": "error",
                "error_code": e.code,
                "message": e.message,
                "details": e.details
            }
        except Exception as e:
            logger.error(f"未预期的服务器错误: {str(e)}", exc_info=True)
            return {
                "status": "error", 
                "error_code": "INTERNAL_SERVER_ERROR",
                "message": "内部服务器错误",
                "details": {"original_error": str(e)}
            }
    return wrapper
```

## 🎪 实现示例

### 赛道一：多智能体协同

```python
# mcp_servers/task_coordinator/server.py
from typing import List, Dict, Any, Optional
from mcp import Tool
from pydantic import BaseModel, Field
from ..base_server import MCPServerBase
from ..exceptions import ValidationError, ResourceNotFoundError
from ..models import handle_mcp_errors

class TaskNode(BaseModel):
    task_id: str
    description: str
    dependencies: List[str]
    required_skills: List[str]
    estimated_duration: float  # 分钟
    assigned_agent: Optional[str] = None

class CoordinationRequest(BaseModel):
    main_task: str = Field(..., description="主要任务描述")
    available_agents: List[str] = Field(..., description="可用智能体列表")
    constraints: Dict[str, Any] = Field(default_factory=dict, description="约束条件")

class TaskCoordinatorServer(MCPServerBase):
    """多智能体任务协调服务器"""
    
    def __init__(self):
        super().__init__("task-coordinator", "1.0.0")
        self.task_graph = {}  # 任务图
        self.agent_skills = {}  # 智能体技能注册
        
    def get_tools(self) -> List[Tool]:
        return [
            self.decompose_complex_task,
            self.assign_tasks_to_agents,
            self.resolve_agent_conflicts,
            self.monitor_task_progress
        ]
    
    @Tool(
        name="decompose_complex_task",
        description="将复杂任务分解为可执行的子任务，并建立依赖关系"
    )
    @handle_mcp_errors
    async def decompose_complex_task(self, request: CoordinationRequest) -> Dict[str, Any]:
        """分解复杂任务工具"""
        if not request.available_agents:
            raise ValidationError("必须提供至少一个可用智能体")
        
        # 分析任务并创建任务图
        task_nodes = await self._analyze_task_structure(request.main_task)
        
        # 建立依赖关系
        task_graph = await self._build_dependency_graph(task_nodes)
        
        return {
            "task_graph": task_graph,
            "total_subtasks": len(task_nodes),
            "critical_path": await self._find_critical_path(task_graph),
            "estimated_total_duration": sum(
                node.estimated_duration for node in task_nodes
            )
        }
    
    @Tool(
        name="assign_tasks_to_agents", 
        description="基于智能体技能和任务需求进行最优任务分配"
    )
    @handle_mcp_errors
    async def assign_tasks_to_agents(
        self, 
        task_graph: Dict[str, TaskNode],
        agent_skills: Dict[str, List[str]]
    ) -> Dict[str, str]:
        """任务分配工具"""
        assignments = {}
        
        for task_id, task_node in task_graph.items():
            # 寻找技能匹配的智能体
            suitable_agents = [
                agent for agent, skills in agent_skills.items()
                if any(skill in skills for skill in task_node.required_skills)
            ]
            
            if not suitable_agents:
                raise ResourceNotFoundError(
                    "具备合适技能的智能体", 
                    f"技能需求: {task_node.required_skills}"
                )
            
            # 简单的负载均衡分配
            assigned_agent = await self._balance_workload(suitable_agents, assignments)
            assignments[task_id] = assigned_agent
            task_node.assigned_agent = assigned_agent
        
        return assignments
    
    async def _analyze_task_structure(self, main_task: str) -> List[TaskNode]:
        """分析任务结构 - 简化实现"""
        # 在实际项目中，这里可以集成LLM进行智能任务分解
        sample_tasks = [
            TaskNode(
                task_id="task_1",
                description="需求分析和规划",
                dependencies=[],
                required_skills=["analysis", "planning"],
                estimated_duration=30.0
            ),
            TaskNode(
                task_id="task_2", 
                description="数据收集和处理",
                dependencies=["task_1"],
                required_skills=["data_collection", "processing"],
                estimated_duration=45.0
            ),
            TaskNode(
                task_id="task_3",
                description="结果分析和报告生成",
                dependencies=["task_2"],
                required_skills=["analysis", "reporting"],
                estimated_duration=25.0
            )
        ]
        return sample_tasks
    
    async def _build_dependency_graph(self, tasks: List[TaskNode]) -> Dict[str, TaskNode]:
        """构建任务依赖图"""
        return {task.task_id: task for task in tasks}
    
    async def _find_critical_path(self, task_graph: Dict[str, TaskNode]) -> List[str]:
        """寻找关键路径 - 简化实现"""
        return list(task_graph.keys())  # 简化实现
    
    async def _balance_workload(self, agents: List[str], assignments: Dict[str, str]) -> str:
        """负载均衡分配"""
        agent_workload = {agent: 0 for agent in agents}
        for assigned_agent in assignments.values():
            if assigned_agent in agent_workload:
                agent_workload[assigned_agent] += 1
        
        return min(agent_workload, key=agent_workload.get)
```

## 🔧 测试规范

### 单元测试示例

```python
# tests/test_memory_manager.py
import pytest
import asyncio
from datetime import datetime, timedelta
from mcp_servers.memory_manager.server import MemoryManagerServer
from mcp_servers.models import SaveMemoryRequest, MemoryType
from mcp_servers.exceptions import ValidationError, ResourceNotFoundError

class TestMemoryManager:
    @pytest.fixture
    async def server(self):
        """创建测试服务器实例"""
        server = MemoryManagerServer()
        await server.initialize()  # 假设有初始化方法
        return server
    
    @pytest.fixture
    def sample_memory_request(self):
        """创建样本记忆请求"""
        return SaveMemoryRequest(
            entity_id="test_agent_123",
            content="用户偏好使用深色模式并在晚上工作",
            memory_type=MemoryType.PREFERENCE,
            importance=8.5,
            tags=["ui_preference", "working_hours"]
        )
    
    @pytest.mark.asyncio
    async def test_save_memory_success(self, server, sample_memory_request):
        """测试成功保存记忆"""
        response = await server.save_memory(sample_memory_request)
        
        assert response.status == "success"
        assert response.memory_id != ""
        assert response.entity_id == "test_agent_123"
        assert len(server.memories) == 1
    
    @pytest.mark.asyncio
    async def test_save_memory_validation_error(self, server):
        """测试记忆保存验证错误"""
        invalid_request = SaveMemoryRequest(
            entity_id="",  # 空的entity_id
            content="测试内容",
            memory_type=MemoryType.CONVERSATION
        )
        
        response = await server.save_memory(invalid_request)
        assert response["status"] == "error"
        assert response["error_code"] == "VALIDATION_ERROR"
    
    @pytest.mark.asyncio
    async def test_recall_memories_semantic_search(self, server, sample_memory_request):
        """测试语义记忆检索"""
        # 先保存测试记忆
        await server.save_memory(sample_memory_request)
        
        # 搜索相关记忆
        from mcp_servers.memory_manager.server import MemoryQuery
        query = MemoryQuery(
            query_text="用户界面偏好设置",
            entity_id="test_agent_123"
        )
        
        results = await server.recall_memories(query)
        
        assert isinstance(results, list)
        assert len(results) > 0
        assert results[0]["entity_id"] == "test_agent_123"
```

### 集成测试示例

```python
# tests/integration/test_payment_workflow.py
import pytest
import asyncio
from mcp_servers.payment_gateway.server import PaymentGatewayServer
from mcp_servers.models import PaymentRequest, InvoiceRequest

class TestPaymentIntegration:
    @pytest.fixture
    async def payment_server(self):
        server = PaymentGatewayServer()
        # 初始化测试余额
        server.balances = {
            "did:sender:test123": 1000.0,
            "did:recipient:test456": 50.0
        }
        return server
    
    @pytest.mark.asyncio
    async def test_complete_payment_workflow(self, payment_server):
        """测试完整支付工作流"""
        # 1. 创建发票
        invoice_request = InvoiceRequest(
            service_description="高级数据分析服务",
            amount=150.0,
            recipient_did="did:recipient:test456"
        )
        
        invoice_result = await payment_server.create_service_invoice(invoice_request)
        assert invoice_result["status"] == "created"
        invoice_id = invoice_result["invoice_id"]
        
        # 2. 执行支付
        payment_request = PaymentRequest(
            sender_did="did:sender:test123",
            recipient_did="did:recipient:test456",
            amount=150.0,
            service_description="高级数据分析服务",
            invoice_id=invoice_id
        )
        
        payment_result = await payment_server.execute_micro_payment(payment_request)
        assert payment_result.status == "completed"
        assert payment_result.amount == 150.0
        
        # 3. 验证余额更新
        sender_balance = await payment_server.check_agent_balance("did:sender:test123")
        assert sender_balance.balance == 850.0  # 1000 - 150
        
        recipient_balance = await payment_server.check_agent_balance("did:recipient:test456")
        assert recipient_balance.balance == 200.0  # 50 + 150
        
        # 4. 验证发票状态
        assert payment_server.invoices[invoice_id]["status"] == "paid"
    
    @pytest.mark.asyncio
    async def test_insufficient_balance_payment(self, payment_server):
        """测试余额不足的支付场景"""
        payment_request = PaymentRequest(
            sender_did="did:sender:test123",
            recipient_did="did:recipient:test456", 
            amount=5000.0,  # 超过余额
            service_description="大额服务"
        )
        
        response = await payment_server.execute_micro_payment(payment_request)
        assert response["status"] == "error"
        assert response["error_code"] == "INSUFFICIENT_BALANCE"
```

## 🚀 部署与运行

### 服务器启动脚本

```python
#!/usr/bin/env python3
# run_mcp_servers.py
import asyncio
import signal
import sys
import logging
from contextlib import AsyncExitStack

from mcp_servers.memory_manager.server import MemoryManagerServer
from mcp_servers.payment_gateway.server import PaymentGatewayServer  
from mcp_servers.task_coordinator.server import TaskCoordinatorServer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MCPServerManager:
    """MCP服务器管理器"""
    
    def __init__(self):
        self.servers = []
        self.is_running = False
        self.exit_stack = AsyncExitStack()
    
    async def initialize_servers(self):
        """初始化所有MCP服务器"""
        logger.info("初始化MCP服务器...")
        
        self.servers = [
            MemoryManagerServer(),
            PaymentGatewayServer(),
            TaskCoordinatorServer()
        ]
        
        # 初始化各个服务器
        for server in self.servers:
            logger.info(f"初始化服务器: {server.server_name}")
            # 这里可以添加服务器特定的初始化逻辑
    
    async def start_servers(self):
        """启动所有MCP服务器"""
        logger.info("启动MCP服务器...")
        
        server_tasks = []
        for server in self.servers:
            task = asyncio.create_task(
                self._run_server(server),
                name=f"server_{server.server_name}"
            )
            server_tasks.append(task)
            logger.info(f"启动服务器: {server.server_name}")
        
        self.is_running = True
        return server_tasks
    
    async def _run_server(self, server):
        """运行单个服务器"""
        try:
            await server.run()
        except Exception as e:
            logger.error(f"服务器 {server.server_name} 运行错误: {str(e)}")
            raise
    
    async def shutdown(self):
        """优雅关闭所有服务器"""
        if not self.is_running:
            return
        
        logger.info("正在关闭MCP服务器...")
        self.is_running = False
        
        # 执行清理操作
        await self.exit_stack.aclose()
        logger.info("所有服务器已关闭")

async def main():
    """主函数"""
    manager = MCPServerManager()
    
    # 设置信号处理
    def signal_handler(sig, frame):
        logger.info(f"接收到信号 {sig}, 正在关闭...")
        asyncio.create_task(manager.shutdown())
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # 初始化并启动服务器
        await manager.initialize_servers()
        server_tasks = await manager.start_servers()
        
        logger.info("所有MCP服务器已启动并运行")
        logger.info("按 Ctrl+C 停止服务器")
        
        # 等待所有服务器任务完成
        await asyncio.gather(*server_tasks, return_exceptions=True)
        
    except Exception as e:
        logger.error(f"服务器管理器错误: {str(e)}")
        await manager.shutdown()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
```

### 环境配置

```python
# config/settings.py
import os
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

class Settings:
    """应用配置"""
    
    # 服务器配置
    MCP_SERVER_HOST: str = os.getenv("MCP_SERVER_HOST", "0.0.0.0")
    MCP_SERVER_PORT: int = int(os.getenv("MCP_SERVER_PORT", "8000"))
    
    # 赛道二：记忆管理配置
    VECTOR_DB_URL: str = os.getenv("VECTOR_DB_URL", "chroma://localhost:8001")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    
    # 赛道三：支付配置  
    X402_NETWORK_URL: str = os.getenv("X402_NETWORK_URL", "https://x402-testnet.example.com")
    BLOCKCHAIN_RPC_URL: str = os.getenv("BLOCKCHAIN_RPC_URL", "")
    
    # 日志配置
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    @property
    def server_config(self) -> Dict[str, Any]:
        """获取服务器配置"""
        return {
            "host": self.MCP_SERVER_HOST,
            "port": self.MCP_SERVER_PORT
        }

# 全局配置实例
settings = Settings()
```

---

**遵循此规范将确保您的MCP实现符合的技术标准，构建出高质量、可维护的MCP服务。**