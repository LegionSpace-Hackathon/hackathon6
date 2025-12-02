#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # 无颜色

echo -e "${BLUE}=====================================${NC}"
echo -e "${GREEN}空间前端 (Space Front) 项目初始化${NC}"
echo -e "${BLUE}=====================================${NC}"

# 检查node和npm是否已安装
if ! [ -x "$(command -v node)" ]; then
  echo -e "${YELLOW}错误: Node.js 未安装${NC}" >&2
  echo "请从 https://nodejs.org/ 安装Node.js"
  exit 1
fi

if ! [ -x "$(command -v npm)" ]; then
  echo -e "${YELLOW}错误: npm 未安装${NC}" >&2
  echo "请安装npm"
  exit 1
fi

# 显示Node版本
echo -e "${BLUE}Node版本:${NC} $(node -v)"
echo -e "${BLUE}NPM版本:${NC} $(npm -v)"

# 安装依赖
echo -e "\n${GREEN}正在安装项目依赖...${NC}"
npm install

# 为Git设置Husky钩子
echo -e "\n${GREEN}正在设置Git钩子...${NC}"
npm run prepare

# 创建环境文件
echo -e "\n${GREEN}创建环境文件...${NC}"

if [ ! -f .env ]; then
  echo "VITE_API_BASE_URL=http://192.168.208.9:10010" > .env
  echo -e "${GREEN}已创建 .env 文件${NC}"
else
  echo -e "${YELLOW}注意: .env 文件已存在${NC}"
fi

# 提示项目设置完成
echo -e "\n${BLUE}=====================================${NC}"
echo -e "${GREEN}项目设置完成!${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "\n运行项目:\n"
echo -e "  ${YELLOW}npm run dev${NC}     - 开发环境"
echo -e "  ${YELLOW}npm run build${NC}   - 构建生产环境"
echo -e "  ${YELLOW}npm run preview${NC} - 预览生产构建"
echo -e "\n祝您开发愉快！\n" 