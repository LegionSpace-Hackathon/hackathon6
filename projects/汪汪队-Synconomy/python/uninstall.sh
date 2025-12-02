#!/bin/bash
# -*- coding: utf-8 -*-
# Linux File Operations MCP Server 卸载脚本
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

# 停止服务
stop_service() {
    log_info "停止MCP服务器..."
    
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        systemctl stop "$SERVICE_NAME"
        log_success "服务已停止"
    else
        log_info "服务未运行"
    fi
}

# 禁用服务
disable_service() {
    log_info "禁用systemd服务..."
    
    if systemctl is-enabled --quiet "$SERVICE_NAME"; then
        systemctl disable "$SERVICE_NAME"
        log_success "服务已禁用"
    else
        log_info "服务未启用"
    fi
}

# 删除服务文件
remove_service_files() {
    log_info "删除服务文件..."
    
    if [[ -f "/etc/systemd/system/$SERVICE_NAME.service" ]]; then
        rm -f "/etc/systemd/system/$SERVICE_NAME.service"
        systemctl daemon-reload
        log_success "服务文件已删除"
    else
        log_info "服务文件不存在"
    fi
}

# 删除管理脚本
remove_management_scripts() {
    log_info "删除管理脚本..."
    
    local scripts=("mcp-start" "mcp-stop" "mcp-restart" "mcp-status" "mcp-logs")
    
    for script in "${scripts[@]}"; do
        if [[ -f "/usr/local/bin/$script" ]]; then
            rm -f "/usr/local/bin/$script"
            log_info "删除脚本: $script"
        fi
    done
    
    log_success "管理脚本已删除"
}

# 删除安装目录
remove_install_directory() {
    log_info "删除安装目录..."
    
    if [[ -d "$INSTALL_DIR" ]]; then
        rm -rf "$INSTALL_DIR"
        log_success "安装目录已删除: $INSTALL_DIR"
    else
        log_info "安装目录不存在: $INSTALL_DIR"
    fi
}

# 删除用户
remove_user() {
    log_info "删除服务用户..."
    
    if id "$SERVICE_USER" &>/dev/null; then
        userdel "$SERVICE_USER"
        log_success "用户已删除: $SERVICE_USER"
    else
        log_info "用户不存在: $SERVICE_USER"
    fi
}

# 清理防火墙规则
cleanup_firewall() {
    log_info "清理防火墙规则..."
    
    if systemctl is-active --quiet firewalld; then
        local ports_removed=false
        if firewall-cmd --query-port=8001/tcp &>/dev/null; then
            firewall-cmd --permanent --remove-port=8001/tcp
            ports_removed=true
        fi
        if firewall-cmd --query-port=8002/tcp &>/dev/null; then
            firewall-cmd --permanent --remove-port=8002/tcp
            ports_removed=true
        fi
        if [[ "$ports_removed" == "true" ]]; then
            firewall-cmd --reload
            log_success "防火墙规则已清理"
        else
            log_info "防火墙规则不存在"
        fi
    else
        log_info "防火墙未运行"
    fi
}

# 确认卸载
confirm_uninstall() {
    echo
    log_warning "此操作将完全删除MCP服务器及其所有数据！"
    echo
    echo "将删除的内容："
    echo "  - 服务文件和配置"
    echo "  - 安装目录: $INSTALL_DIR"
    echo "  - 服务用户: $SERVICE_USER"
    echo "  - 管理脚本"
    echo "  - 防火墙规则"
    echo
    read -p "确定要继续吗？(y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "卸载已取消"
        exit 0
    fi
}

# 显示卸载信息
show_uninstall_info() {
    log_success "卸载完成！"
    echo
    echo "=========================================="
    echo "MCP服务器卸载信息"
    echo "=========================================="
    echo "已删除的内容："
    echo "  ✓ 服务文件和配置"
    echo "  ✓ 安装目录: $INSTALL_DIR"
    echo "  ✓ 服务用户: $SERVICE_USER"
    echo "  ✓ 管理脚本"
    echo "  ✓ 防火墙规则"
    echo
    echo "注意："
    echo "  - Python依赖包未删除（如需删除请手动执行）"
    echo "  - 系统依赖包未删除（如需删除请手动执行）"
    echo "=========================================="
}

# 主函数
main() {
    echo "=========================================="
    echo "Linux File Operations MCP Server 卸载程序"
    echo "适用于 CentOS 7"
    echo "=========================================="
    
    check_root
    confirm_uninstall
    stop_service
    disable_service
    remove_service_files
    remove_management_scripts
    remove_install_directory
    remove_user
    cleanup_firewall
    show_uninstall_info
}

# 运行主函数
main "$@"
