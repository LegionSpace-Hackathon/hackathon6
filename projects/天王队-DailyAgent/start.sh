#!/bin/bash
# 启动脚本 - 加载Sass环境变量并启动项目

# 加载Sass环境变量
export $(grep -v '^#' sass.env | xargs)

# 显示环境变量
echo "加载SASS环境变量..."
echo "SASS_QUIET_DEPS=$SASS_QUIET_DEPS"
echo "SASS_NO_DEPRECATE_API_PUSH=$SASS_NO_DEPRECATE_API_PUSH"

# 使用兼容的Node.js版本
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 如果nvm可用，使用兼容的Node.js版本
if command -v nvm &> /dev/null; then
  nvm use 18 || nvm install 18
elif command -v n &> /dev/null; then
  n 18
fi

# 安装依赖
npm install --registry=https://registry.npmmirror.com

# 执行构建，使用CI专用命令
CI='' npm run build:ci

echo "构建完成，产物在dist目录"

# 启动项目
echo "启动项目..."
npm run dev 