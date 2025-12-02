# CentOS 7 部署指南

## 概述

本指南将帮助您在CentOS 7服务器上部署Linux File Operations MCP Server，使用FastMCP框架和SSE传输协议，专为Dify平台优化。提供两种运行方式：
1. **systemd服务方式**（推荐）- 系统级服务，开机自启
2. **后台脚本方式** - 简单的后台运行

## 系统要求

- CentOS 7.x
- Python 3.7+
- Root权限或sudo权限
- 网络连接到目标Linux服务器
- MCP框架支持（通过pip install mcp安装）

## 方式一：systemd服务部署（推荐）

### 1. 上传项目文件

将项目文件上传到服务器：

```bash
# 创建临时目录
mkdir -p /tmp/mcp-server
cd /tmp/mcp-server

# 上传项目文件（使用scp、rsync或其他方式）
# 例如：scp -r /path/to/difymcp root@your-server:/tmp/mcp-server/
```

### 2. 运行安装脚本

```bash
# 进入项目目录
cd /tmp/mcp-server/python

# 给安装脚本执行权限
chmod +x install.sh

# 运行安装脚本
sudo ./install.sh
```

安装脚本会自动完成以下操作：
- 检查系统环境和Python版本
- 安装系统依赖包
- 创建服务用户和目录
- 复制项目文件到 `/opt/mcp-server`
- 安装Python依赖包
- 配置systemd服务
- 创建管理脚本
- 配置防火墙规则
- 启动服务

### 3. 验证安装

```bash
# 查看服务状态
mcp-status

# 或者使用systemctl
systemctl status mcp-server

# 查看日志
mcp-logs

# 或者使用journalctl
journalctl -u mcp-server -f
```

### 4. 管理命令

```bash
# 启动服务
mcp-start
# 或
systemctl start mcp-server

# 停止服务
mcp-stop
# 或
systemctl stop mcp-server

# 重启服务
mcp-restart
# 或
systemctl restart mcp-server

# 查看状态
mcp-status
# 或
systemctl status mcp-server

# 查看日志
mcp-logs
# 或
journalctl -u mcp-server -f
```

### 5. 配置服务器信息

编辑配置文件：

```bash
sudo vim /opt/mcp-server/python/server.py
```

修改以下配置：

```python
REMOTE_HOST = "192.168.109.212"  # 目标服务器IP（可以是localhost/127.0.0.1，表示本地与远程为同一台机器）
USERNAME = "root"                # SSH用户名
PASSWORD = "tfd@2025"            # SSH密码
# Conda环境配置（可选）
CONDA_ENV_NAME = ""  # 如果Python部署在conda环境中，设置环境名称，例如 "myenv"

# 风险分析目录配置（用于文件上传接口）
RISK_ANALYSIS_DIR = "/usr/local/risk_analysis/"  # 上传文件的目标目录

# 文档输出目录配置（用于 Markdown 转换功能）
DOCUMENT_OUTPUT_DIR = "/usr/local/risk_analysis/docs/"  # Markdown 转换生成的文档保存目录
```

**关于服务器配置**：
- **本地与远程为同一台机器**：可以将 `REMOTE_HOST` 设置为 `"127.0.0.1"` 或 `"localhost"`，系统仍会通过SSH连接（即使是自己连自己）
  - 请确保SSH服务正常运行：`systemctl status sshd` 或 `systemctl status ssh`
  - 需要正确配置SSH认证（密码或密钥）
  - 如果本地与远程为同一台机器，可以直接测试：`ssh root@127.0.0.1`

**关于Conda环境配置**：
- **重要说明**：`CONDA_ENV_NAME` 配置仅用于**远程服务器**（REMOTE_HOST），不用于本地服务器
- **本地服务器**（运行server.py的机器）：
  - 如果使用conda环境运行server.py，只需在conda环境中安装依赖包即可，不需要配置此项
- **远程服务器**（REMOTE_HOST）：
  - 如果远程服务器上的Python代码部署在conda环境中，设置 `CONDA_ENV_NAME` 为远程服务器的conda环境名称
  - 系统会在执行远程Python相关命令时自动激活指定的conda环境
  - 如果远程服务器未使用conda环境，保持 `CONDA_ENV_NAME = ""` 即可

重启服务使配置生效：

```bash
mcp-restart
```

## 方式二：后台脚本部署

### 1. 安装依赖

```bash
# 安装Python 3和pip
sudo yum install -y python3 python3-pip

# 安装其他依赖
sudo yum install -y python3-devel gcc openssl-devel libffi-devel
```

### 2. 上传项目文件

```bash
# 创建项目目录
mkdir -p /opt/mcp-server
cd /opt/mcp-server

# 上传项目文件
# 例如：scp -r /path/to/difymcp/python/* /opt/mcp-server/
```

### 3. 安装Python依赖

```bash
cd /opt/mcp-server

# 升级pip
python3 -m pip install --upgrade pip

# 安装依赖
python3 -m pip install -r requirements.txt
```

### 4. 配置服务器信息

```bash
vim server.py
```

修改配置信息：

```python
REMOTE_HOST = "192.168.109.212"  # 目标服务器IP
USERNAME = "root"                # SSH用户名
PASSWORD = "tfd@2025"            # SSH密码
# Conda环境配置（可选）
CONDA_ENV_NAME = ""  # 如果Python部署在conda环境中，设置环境名称，例如 "myenv"

# 风险分析目录配置（用于文件上传接口）
RISK_ANALYSIS_DIR = "/usr/local/risk_analysis/"  # 上传文件的目标目录

# 文档输出目录配置（用于 Markdown 转换功能）
DOCUMENT_OUTPUT_DIR = "/usr/local/risk_analysis/docs/"  # Markdown 转换生成的文档保存目录
```

**关于Conda环境配置**：
- 如果远程服务器的Python部署在conda环境中，设置 `CONDA_ENV_NAME` 为您的conda环境名称
- 系统会在执行Python相关命令时自动激活指定的conda环境
- 如果未使用conda环境或环境未设置，保持 `CONDA_ENV_NAME = ""` 即可

### 5. 使用后台脚本

```bash
# 给脚本执行权限
chmod +x run_background.sh

# 启动服务
./run_background.sh start

# 查看状态
./run_background.sh status

# 查看日志
./run_background.sh logs

# 停止服务
./run_background.sh stop

# 重启服务
./run_background.sh restart
```

## 防火墙配置

### 开放端口

```bash
# 如果使用firewalld
sudo firewall-cmd --permanent --add-port=8001/tcp
sudo firewall-cmd --reload

# 如果使用iptables
sudo iptables -A INPUT -p tcp --dport 8001 -j ACCEPT
sudo service iptables save
```

## 客户端配置

### Dify平台配置

- **传输协议**: SSE
- **端点URL**: `http://your-server-ip:8001/sse`
- **Docker环境**: `http://host.docker.internal:8001/sse`

### Cursor配置

```json
{
  "mcpServers": {
    "LinuxFileOpsMCP": {
      "type": "sse",
      "url": "http://your-server-ip:8001/sse"
    }
  }
}
```

### 测试连接

访问以下URL测试服务：
- SSE端点：`http://your-server-ip:8001/sse`
- 工具列表：`http://your-server-ip:8001/tools`
- Docker环境：`http://host.docker.internal:8001/sse`

## 故障排除

### 1. 服务启动失败

```bash
# 查看详细日志
journalctl -u mcp-server -n 50

# 检查Python依赖
python3 -c "import fastapi, uvicorn, paramiko"

# 检查端口占用
netstat -tlnp | grep :8001
```

### 2. 连接问题

```bash
# 测试SSH连接
ssh root@192.168.109.212

# 检查防火墙
firewall-cmd --list-ports
iptables -L -n | grep 8001
```

### 3. 权限问题

```bash
# 检查文件权限
ls -la /opt/mcp-server/

# 修复权限
sudo chown -R mcp:mcp /opt/mcp-server/
sudo chmod -R 755 /opt/mcp-server/
```

### 4. Conda环境相关问题

**问题**：配置了conda环境但命令执行失败

**解决方案**：

```bash
# 1. 确认conda已安装并可用
conda --version

# 2. 查看所有conda环境
conda env list

# 3. 测试环境激活
source $(conda info --base)/etc/profile.d/conda.sh
conda activate your_env_name

# 4. 确保conda环境中已安装pip
conda activate your_env_name
python -m pip --version

# 5. 如果pip不存在，安装它
conda install pip -n your_env_name
```

**检查配置**：
- 确认 `server.py` 中的 `CONDA_ENV_NAME` 设置正确
- 确保环境名称与 `conda env list` 中的名称一致
- 检查conda初始化脚本路径是否正确

### 5. _ctypes模块缺失问题

**问题**：执行 `python3 -c "import _ctypes"` 时提示 `ModuleNotFoundError: No module named '_ctypes'`

**原因**：Python 的 `_ctypes` 模块需要 `libffi` 库支持，如果系统缺少 `libffi-devel` 开发包，Python 编译时就不会包含 ctypes 支持。

**解决方案**：

#### 对于 CentOS 7 / openEuler 系统：

```bash
# 1. 安装 libffi-devel 开发包
sudo yum install -y libffi-devel

# 2. 如果是从源码编译安装的 Python，需要重新编译
# 如果使用的是系统自带的 Python3，安装 libffi-devel 后通常即可解决

# 3. 验证安装
python3 -c "import _ctypes; print('_ctypes 模块正常')"
```

#### 如果问题仍然存在：

```bash
# 1. 确保安装了所有必要的开发包
sudo yum install -y python3-devel gcc openssl-devel libffi-devel zlib-devel bzip2-devel readline-devel sqlite-devel

# 2. 检查 Python 是否支持 ctypes
python3 -c "import sysconfig; print(sysconfig.get_config_var('HAVE_LIBFFI'))"
# 如果输出为空或 False，说明 Python 编译时未包含 libffi 支持

# 3. 如果 Python 是从源码编译的，需要重新编译：
# 下载 Python 源码
# 编译前确保 libffi-devel 已安装
# 重新编译安装 Python

# 4. 对于系统自带的 Python，如果问题仍然存在，可以尝试：
sudo yum reinstall python3 python3-devel
```

#### 对于 openEuler 系统（使用 yum 或 dnf）：

```bash
# openEuler 系统通常使用 yum，但某些版本可能使用 dnf
# 尝试以下命令之一：

# 使用 yum
sudo yum install -y libffi-devel python3-devel

# 如果 yum 不可用，尝试 dnf
sudo dnf install -y libffi-devel python3-devel

# 验证
python3 -c "import _ctypes; print('_ctypes 模块正常')"
```

#### 处理包版本冲突（openEuler 常见问题）：

**问题**：安装 `libffi-devel` 时提示版本冲突，例如：
```
Error: package libffi-devel-3.3-7.oe1.x86_64 requires libffi = 3.3-7.oe1, 
but none of the providers can be installed
- cannot install both libffi-3.3-7.oe1.x86_64 and libffi-3.4.2-2.oe2203.x86_64
```

**原因**：系统中已安装的 `libffi` 版本与仓库中的 `libffi-devel` 版本不匹配。

**解决方案**：

```bash
# 方法1：查找与已安装 libffi 版本匹配的 libffi-devel
# 1. 查看当前已安装的 libffi 版本
rpm -qa | grep libffi

# 2. 查找可用的 libffi-devel 版本
yum list available libffi-devel

# 3. 尝试安装匹配版本的 libffi-devel（例如，如果 libffi 是 3.4.2-2.oe2203）
sudo yum install -y libffi-devel-3.4.2-2.oe2203

# 方法2：如果找不到匹配版本，尝试更新仓库索引
sudo yum clean all
sudo yum makecache
sudo yum install -y libffi-devel

# 方法3：使用 --nobest 选项安装最佳可用版本
sudo yum install --nobest -y libffi-devel

# 方法4：如果以上方法都不行，检查 Python 是否真的需要重新编译
# 对于系统自带的 Python，通常已经编译好了，即使缺少 libffi-devel 也可能可用
python3 -c "import ctypes; print('ctypes 模块可用')"
# 如果 ctypes 可用，说明 _ctypes 也可能可用（虽然导入测试可能失败）

# 方法5：如果确实需要 libffi-devel，尝试从源码安装
# 注意：这需要编译工具链
sudo yum install -y gcc make wget
cd /tmp
wget https://github.com/libffi/libffi/releases/download/v3.4.2/libffi-3.4.2.tar.gz
tar -xzf libffi-3.4.2.tar.gz
cd libffi-3.4.2
./configure --prefix=/usr/local
make
sudo make install
# 然后重新编译 Python（如果是从源码安装的）

# 验证
python3 -c "import _ctypes; print('_ctypes 模块正常')"
```

**推荐方案**：对于 openEuler 2203 系统，建议按以下顺序尝试：

```bash
# 1. 首先尝试更新仓库并查找匹配版本
sudo yum clean all
sudo yum makecache
yum list available libffi-devel | grep oe2203

# 2. 如果找到匹配版本，直接安装
sudo yum install -y libffi-devel-3.4.2-2.oe2203

# 3. 如果找不到，尝试使用 --nobest
sudo yum install --nobest -y libffi-devel

# 4. 如果仍然失败，检查 Python 本身的 ctypes 支持
python3 -c "import ctypes; print('ctypes 可用')"
python3 -c "import sysconfig; print(sysconfig.get_config_var('HAVE_LIBFFI'))"
```

**注意事项**：
- 如果 Python 是从源码编译安装的，安装 `libffi-devel` 后需要重新编译 Python
- 如果使用的是系统自带的 Python，安装 `libffi-devel` 后通常即可解决问题
- `_ctypes` 模块是许多 Python 包（如 cryptography、bcrypt 等）的底层依赖，缺失会导致这些包无法正常工作

## 卸载

### systemd服务方式

```bash
# 运行卸载脚本
sudo ./uninstall.sh
```

### 后台脚本方式

```bash
# 停止服务
./run_background.sh stop

# 删除目录
sudo rm -rf /opt/mcp-server
```

## 安全建议

1. **更改默认密码**：修改server.py中的SSH密码
2. **使用SSH密钥**：替换密码认证为密钥认证
3. **限制访问**：配置防火墙只允许特定IP访问
4. **定期更新**：保持系统和依赖包的最新版本
5. **监控日志**：定期检查访问和错误日志

## 性能优化

### 1. 连接池配置

对于高并发场景，可以修改server.py中的连接超时设置：

```python
client.connect(REMOTE_HOST, username=USERNAME, password=PASSWORD, timeout=30)
```

### 2. 内存优化

定期重启服务以释放内存：

```bash
# 创建定时任务
echo "0 2 * * * systemctl restart mcp-server" | sudo crontab -
```

### 3. 日志轮转

配置日志轮转避免日志文件过大：

```bash
sudo vim /etc/logrotate.d/mcp-server
```

添加内容：

```
/opt/mcp-server/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 mcp mcp
    postrotate
        systemctl reload mcp-server
    endscript
}
```

## 联系支持

如遇到问题，请检查：
1. 系统版本和Python版本
2. 网络连接状态
3. 服务器配置信息
4. 依赖包版本
5. 系统权限设置

更多详细信息请参考 `README.md` 文件。
