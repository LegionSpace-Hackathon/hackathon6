from typing import List,Dict,Any,Optional.
from mcp import Tool
from pydantic import Basemodel,Field
from ..base_server import MCPServerBase
from ..exceptions import ValidationError,Resource...
from ..models import handle_mcp_errors



class Tasknode(BaseModel)
class CoordiantionRequest (BaseModel):
main_task:str =Field (...,description ="主要任务描述")
avaliable_agents:List[str]=Field(...,description=“可用智能体列表”)
constraints:Dict[str,Any]=field(default_factory=dict,description="约束条件")


