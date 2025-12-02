#!/bin/bash
# -*- coding: utf-8 -*-
# Linux File Operations MCP Server 后台运行脚本
# 适用于 CentOS 7（不使用systemd）
# 使用 FastMCP 框架和 SSE 传输协议

set -e

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_SCRIPT="$SCRIPT_DIR/server.py"
PID_FILE="/tmp/mcp-server.pid"
LOG_FILE="/tmp/mcp-server.log"

# 检测Python命令：在conda环境中使用python，否则使用python3
detect_python_command() {
    if [ -n "$CONDA_DEFAULT_ENV" ] || [ -n "$(conda info --envs 2>/dev/null | grep -E '^\*')" ]; then
        echo "python"
    else
        echo "python3"
    fi
}

PYTHON_BIN=$(detect_python_command)

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Python
check_python() {
    if ! command -v "$PYTHON_BIN" &> /dev/null; then
        log_error "未找到 $PYTHON_BIN，请先安装Python 3"
        exit 1
    fi
}

# 检查服务器脚本
check_server_script() {
    if [[ ! -f "$SERVER_SCRIPT" ]]; then
        log_error "服务器脚本不存在: $SERVER_SCRIPT"
        exit 1
    fi
}

# 检查服务是否运行
is_running() {
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# 启动服务
start_service() {
    log_info "启动MCP服务器..."
    
    if is_running; then
        log_warning "MCP服务器已在运行中"
        return 0
    fi
    
    check_python
    check_server_script
    
    # 切换到脚本目录
    cd "$SCRIPT_DIR"
    
    # 后台启动服务
    nohup "$PYTHON_BIN" "$SERVER_SCRIPT" > "$LOG_FILE" 2>&1 &
    local pid=$!
    
    # 保存PID
    echo "$pid" > "$PID_FILE"
    
    # 等待服务启动
    sleep 3
    
    if is_running; then
        log_success "MCP服务器启动成功 (PID: $pid)"
        log_info "日志文件: $LOG_FILE"
        log_info "PID文件: $PID_FILE"
    else
        log_error "MCP服务器启动失败"
        log_info "查看日志: tail -f $LOG_FILE"
        exit 1
    fi
}

# 停止服务
stop_service() {
    log_info "停止MCP服务器..."
    
    if ! is_running; then
        log_warning "MCP服务器未运行"
        return 0
    fi
    
    local pid=$(cat "$PID_FILE")
    
    # 尝试优雅停止
    kill "$pid" 2>/dev/null || true
    
    # 等待进程结束
    local count=0
    while ps -p "$pid" > /dev/null 2>&1 && [[ $count -lt 10 ]]; do
        sleep 1
        ((count++))
    done
    
    # 强制停止
    if ps -p "$pid" > /dev/null 2>&1; then
        log_warning "强制停止服务..."
        kill -9 "$pid" 2>/dev/null || true
        sleep 1
    fi
    
    # 清理PID文件
    rm -f "$PID_FILE"
    
    log_success "MCP服务器已停止"
}

# 重启服务
restart_service() {
    log_info "重启MCP服务器..."
    stop_service
    sleep 2
    start_service
}

# 查看状态
show_status() {
    if is_running; then
        local pid=$(cat "$PID_FILE")
        log_success "MCP服务器正在运行 (PID: $pid)"
        
        # 显示进程信息
        echo
        echo "进程信息:"
        ps -p "$pid" -o pid,ppid,cmd,etime,pcpu,pmem
        
        # 显示端口信息
        echo
        echo "端口信息:"
        netstat -tlnp | grep ":8001" || echo "端口8001未监听"
        netstat -tlnp | grep ":8002" || echo "端口8002未监听"
        
        # 显示日志文件大小
        if [[ -f "$LOG_FILE" ]]; then
            echo
            echo "日志文件: $LOG_FILE ($(du -h "$LOG_FILE" | cut -f1))"
        fi
    else
        log_warning "MCP服务器未运行"
    fi
}

# 查看日志
show_logs() {
    if [[ -f "$LOG_FILE" ]]; then
        log_info "显示MCP服务器日志 (按Ctrl+C退出):"
        tail -f "$LOG_FILE"
    else
        log_warning "日志文件不存在: $LOG_FILE"
    fi
}

# 显示帮助
show_help() {
    echo "Linux File Operations MCP Server 管理脚本"
    echo "使用 FastMCP 框架和 SSE 传输协议"
    echo
    echo "用法: $0 {start|stop|restart|status|logs|help}"
    echo
    echo "命令:"
    echo "  start   - 启动MCP服务器"
    echo "  stop    - 停止MCP服务器"
    echo "  restart - 重启MCP服务器"
    echo "  status  - 查看服务状态"
    echo "  logs    - 查看实时日志"
    echo "  help    - 显示此帮助信息"
    echo
    echo "服务信息:"
    echo "  MCP SSE端点: http://localhost:8001/sse"
    echo "  HTTP API端点: http://localhost:8002"
    echo "  文件上传接口: http://localhost:8002/upload/risk-analysis"
    echo "  健康检查接口: http://localhost:8002/health"
    echo "  Docker环境: http://host.docker.internal:8001/sse"
    echo "  工具列表: http://localhost:8001/tools"
    echo
    echo "文件位置:"
    echo "  服务器脚本: $SERVER_SCRIPT"
    echo "  PID文件:    $PID_FILE"
    echo "  日志文件:   $LOG_FILE"
}

# 主函数
main() {
    case "${1:-help}" in
        start)
            start_service
            ;;
        stop)
            stop_service
            ;;
        restart)
            restart_service
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            echo
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"
