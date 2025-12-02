
# D市场&插件后端研发文档

### 1.1 项目描述
本项目是集法务智能体平台

### 1.2 核心功能

### 1.3 仓库地址

http://git.tongfudun.com/agent-plugins/vigil/vigil-api.git

### 1.4 系统总体架构

采用Springboot+MyBatis平台架构，前后端分离设计

### 1.5 技术栈

- **平台**：Springboot、MyBatis
- **数据库**：Mysql
- **组件**：ElasticSearch、Redis

### 1.6 目录结构
```
VIGIL-API
└─src
    └─main
        ├─java
        │  └─com
        │      └─payegis
        │          └─cloud
        │              └─vigil
        │                  ├─common         #公用常量类
        │                  ├─controller     #控制类
        │                  ├─core           #配置类
        │                  ├─entity         #实体类
        │                  ├─exception      #异常类
        │                  ├─form           #前端交互表单类
        │                  ├─handler        #支付处理类
        │                  ├─mapper         #Mybatis mapper
        │                  ├─service        #Service类
        │                  ├─utils          #工具类
        │                  └─vo             #前端展示实体类
        └─resources
            ├─i18n                          #国际化文件
            └─mapper                        #Mybatis mapper xml

    
```

### 1.7 部署

- 测试环境服务器IP：192.168.83.20
- 打包命令mvn clean package -Ptest

- 生产环境服务器IP：（DAppStore）192.168.97.210  192.168.97.211 （插件）192.168.97.208  192.168.97.209
- 打包命令mvn clean package -Pcloud

### 1.8 插件功能

### 1.9 插件接口