#!/bin/bash
# -*- coding: utf-8 -*-
# Linux File Operations MCP Server 安装脚本
# 适用于 CentOS 7

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
INSTALL_DIR="/opt/mcp-server"
SERVICE_USER="mcp"
SERVICE_NAME="mcp-server"
PYTHON_VERSION="3.7"

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

# 检查是否为root用户
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "此脚本需要root权限运行"
        log_info "请使用: sudo $0"
        exit 1
    fi
}

# 检查系统版本
check_system() {
    log_info "检查系统版本..."
    
    if [[ ! -f /etc/centos-release ]]; then
        log_error "此脚本仅支持CentOS系统"
        exit 1
    fi
    
    local centos_version=$(cat /etc/centos-release | grep -oE '[0-9]+' | head -1)
    if [[ $centos_version -lt 7 ]]; then
        log_error "此脚本需要CentOS 7或更高版本"
        exit 1
    fi
    
    log_success "系统版本检查通过: CentOS $centos_version"
}

# 检查Python版本
check_python() {
    log_info "检查Python版本..."
    
    if ! command -v python3 &> /dev/null; then
        log_error "未找到python3，请先安装Python 3.7+"
        log_info "安装命令: yum install python3 python3-pip"
        exit 1
    fi
    
    local python_version=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    local major_version=$(echo $python_version | cut -d. -f1)
    local minor_version=$(echo $python_version | cut -d. -f2)
    
    if [[ $major_version -lt 3 ]] || [[ $major_version -eq 3 && $minor_version -lt 7 ]]; then
        log_error "需要Python 3.7或更高版本，当前版本: $python_version"
        exit 1
    fi
    
    log_success "Python版本检查通过: $python_version"
}

# 安装依赖包
install_dependencies() {
    log_info "安装系统依赖包..."
    
    yum update -y
    yum install -y python3 python3-pip python3-devel gcc openssl-devel libffi-devel
    
    log_success "系统依赖包安装完成"
}

# 创建用户和目录
setup_user_and_dirs() {
    log_info "创建用户和目录..."
    
    # 创建用户（如果不存在）
    if ! id "$SERVICE_USER" &>/dev/null; then
        useradd -r -s /bin/false -d "$INSTALL_DIR" "$SERVICE_USER"
        log_success "创建用户: $SERVICE_USER"
    else
        log_info "用户已存在: $SERVICE_USER"
    fi
    
    # 创建安装目录
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$INSTALL_DIR/logs"
    mkdir -p "$INSTALL_DIR/backup"
    
    log_success "目录创建完成"
}

# 复制文件
copy_files() {
    log_info "复制项目文件..."
    
    # 获取当前脚本所在目录
    local script_dir=$(dirname "$(readlink -f "$0")")
    
    # 复制python目录
    cp -r "$script_dir" "$INSTALL_DIR/"
    
    # 设置权限
    chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
    chmod -R 755 "$INSTALL_DIR"
    # 确保启动脚本有执行权限
    chmod +x "$INSTALL_DIR/python/start_server.sh" 2>/dev/null || true
    
    log_success "文件复制完成"
}

# 安装Python依赖
install_python_deps() {
    log_info "安装Python依赖包..."
    
    cd "$INSTALL_DIR/python"
    
    # 升级pip
    python3 -m pip install --upgrade pip
    
    # 安装依赖
    python3 -m pip install -r requirements.txt
    
    log_success "Python依赖包安装完成"
}

# 配置systemd服务
setup_systemd_service() {
    log_info "配置systemd服务..."
    
    # 复制服务文件
    cp "$INSTALL_DIR/python/mcp-server.service" "/etc/systemd/system/"
    
    # 重新加载systemd配置
    systemctl daemon-reload
    
    # 启用服务
    systemctl enable "$SERVICE_NAME"
    
    log_success "systemd服务配置完成"
}

# 创建管理脚本
create_management_scripts() {
    log_info "创建管理脚本..."
    
    # 创建启动脚本
    cat > /usr/local/bin/mcp-start << 'EOF'
#!/bin/bash
systemctl start mcp-server
echo "MCP服务器已启动"
systemctl status mcp-server --no-pager
EOF
    
    # 创建停止脚本
    cat > /usr/local/bin/mcp-stop << 'EOF'
#!/bin/bash
systemctl stop mcp-server
echo "MCP服务器已停止"
EOF
    
    # 创建重启脚本
    cat > /usr/local/bin/mcp-restart << 'EOF'
#!/bin/bash
systemctl restart mcp-server
echo "MCP服务器已重启"
systemctl status mcp-server --no-pager
EOF
    
    # 创建状态脚本
    cat > /usr/local/bin/mcp-status << 'EOF'
#!/bin/bash
systemctl status mcp-server --no-pager
EOF
    
    # 创建日志查看脚本
    cat > /usr/local/bin/mcp-logs << 'EOF'
#!/bin/bash
journalctl -u mcp-server -f
EOF
    
    # 设置执行权限
    chmod +x /usr/local/bin/mcp-*
    
    log_success "管理脚本创建完成"
}

# 配置防火墙
setup_firewall() {
    log_info "配置防火墙..."
    
    if systemctl is-active --quiet firewalld; then
        firewall-cmd --permanent --add-port=8001/tcp
        firewall-cmd --permanent --add-port=8002/tcp
        firewall-cmd --reload
        log_success "防火墙规则添加完成"
    else
        log_warning "防火墙未运行，请手动开放8001和8002端口"
    fi
}

# 启动服务
start_service() {
    log_info "启动MCP服务器..."
    
    systemctl start "$SERVICE_NAME"
    sleep 3
    
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        log_success "MCP服务器启动成功"
    else
        log_error "MCP服务器启动失败"
        log_info "查看日志: journalctl -u $SERVICE_NAME"
        exit 1
    fi
}

# 显示安装信息
show_install_info() {
    log_success "安装完成！"
    echo
    echo "=========================================="
    echo "MCP服务器安装信息"
    echo "=========================================="
    echo "安装目录: $INSTALL_DIR"
    echo "服务用户: $SERVICE_USER"
    echo "服务名称: $SERVICE_NAME"
    echo "MCP端口: 8001"
    echo "HTTP端口: 8002"
    echo "MCP SSE端点: http://服务器IP:8001/sse"
    echo "HTTP API端点: http://服务器IP:8002"
    echo "文件上传接口: http://服务器IP:8002/upload/risk-analysis"
    echo "健康检查接口: http://服务器IP:8002/health"
    echo
    echo "管理命令:"
    echo "  启动服务: mcp-start"
    echo "  停止服务: mcp-stop"
    echo "  重启服务: mcp-restart"
    echo "  查看状态: mcp-status"
    echo "  查看日志: mcp-logs"
    echo
    echo "systemctl命令:"
    echo "  systemctl start $SERVICE_NAME"
    echo "  systemctl stop $SERVICE_NAME"
    echo "  systemctl restart $SERVICE_NAME"
    echo "  systemctl status $SERVICE_NAME"
    echo "  journalctl -u $SERVICE_NAME -f"
    echo
    echo "配置文件位置:"
    echo "  服务配置: /etc/systemd/system/$SERVICE_NAME.service"
    echo "  应用配置: $INSTALL_DIR/python/server.py"
    echo "=========================================="
}

# 主函数
main() {
    echo "=========================================="
    echo "Linux File Operations MCP Server 安装程序"
    echo "适用于 CentOS 7"
    echo "=========================================="
    
    check_root
    check_system
    check_python
    install_dependencies
    setup_user_and_dirs
    copy_files
    install_python_deps
    setup_systemd_service
    create_management_scripts
    setup_firewall
    start_service
    show_install_info
}

# 运行主函数
main "$@"
