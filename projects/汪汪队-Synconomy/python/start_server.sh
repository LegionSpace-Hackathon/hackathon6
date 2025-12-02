#!/bin/bash
# Linux File Operations MCP Server 启动脚本
# 自动检测Python命令：在conda环境中使用python，否则使用python3

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_SCRIPT="$SCRIPT_DIR/server.py"

# 检测Python命令：在conda环境中使用python，否则使用python3
detect_python_command() {
    # 如果CONDA_DEFAULT_ENV环境变量已设置，说明在conda环境中
    if [ -n "$CONDA_DEFAULT_ENV" ]; then
        echo "python"
        return
    fi
    
    # 尝试检查conda是否可用并且有激活的环境
    if command -v conda >/dev/null 2>&1; then
        # 初始化conda（如果还未初始化）
        if [ -z "$CONDA_SHLVL" ]; then
            if [ -f "$(conda info --base 2>/dev/null)/etc/profile.d/conda.sh" ]; then
                source "$(conda info --base)/etc/profile.d/conda.sh" 2>/dev/null || true
            fi
        fi
        
        # 检查是否有激活的conda环境
        if [ -n "$CONDA_DEFAULT_ENV" ] || [ -n "$(conda info --envs 2>/dev/null | grep -E '^\*')" ]; then
            echo "python"
            return
        fi
    fi
    
    # 默认使用python3
    echo "python3"
}

# 检测并获取Python命令
PYTHON_BIN=$(detect_python_command)

# 执行服务器脚本
exec "$PYTHON_BIN" "$SERVER_SCRIPT" "$@"

