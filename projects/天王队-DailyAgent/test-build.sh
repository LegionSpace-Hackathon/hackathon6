#!/bin/bash

echo "构建 Space Front 应用..."
npm run build

if [ $? -ne 0 ]; then
  echo "构建失败，退出测试"
  exit 1
fi

echo "启动测试服务器..."
cd dist && python3 -m http.server 8090 &
SERVER_PID=$!

echo "测试服务器已启动在 http://localhost:8090"
echo "按 CTRL+C 停止服务器"

# 捕获 CTRL+C 信号
trap "kill $SERVER_PID; echo '停止测试服务器'; exit 0" SIGINT

# 等待用户手动停止
while true; do
  sleep 1
done 