
项目名称：
菜财才-说话钱包

一句话介绍：三个自主钱包连接消费者，创作者和赞助商，实现自主创作者经济系统。





主要功能说明：
定义三个智能体，分别是 AI赞助商，AI博主创作者，以及AI打赏的消费者。
应用于创作者经济，分别是三个可自主进行经济决定的智能体钱包，
一个是创作者AI agent 钱包，一个是赞助商钱包，一个是消费者钱包。
aget Economies，自主机器经济
探索AI与支付技术的深度结合，结合跨领域最新技术，例如ERC-8004为AI智能体建立去中心化与身份声誉系统，借助x 402协议实现季期间的微支付与价值交换。
最终构建一个由自主智能体驱动，在区块链上原生运行的新型数字经济生态.


运行实例：
1. 赞助商Agent → 创作者Agent
• 赞助任务、订阅支持 → 触发微支付
2. 消费者Agent → 创作者Agent
• 消费内容（观看/点赞/评论） → 触发微支付
3. 创作者Agent → 赞助商Agent
• 达成任务/内容反馈 → 返利或分成


每个Agent都绑定ERC-8004身份和钱包
每次 微支付事件都通过x402协议触发
交易在链上记录，同时更新Agent声誉/信誉分
Bazaar用于发现可订阅的创作者或赞助项目



| MCP Tool 名称                | 功能                             |
| -------------------------- | ------------------------------ |
| **payment_gateway_server** | 负责 ERC-8004 身份签名、x402 支付、钱包微支付 |
| **bazaar_market_server**   | 负责 X402 Bazaar 市场交互（上架、购买、查询）  |
| **content_trigger_server** | 负责内容消费→触发微支付事件（Event MCP Tool） |



每个钱包作为独立的 MCP Server 模块：

CreatorWalletServer（创作者智能体钱包）

ConsumerWalletServer（消费者智能体钱包）

SponsorWalletServer（赞助商智能体钱包）



| 功能       | 工具名称                | 描述                       |
| -------- | ------------------- | ------------------------ |
| 查询余额     | `get_balance`       | 返回钱包余额                   |
| 发起支付     | `send_payment`      | 智能体之间转账                  |
| 扣款/结算    | `stream_settlement` | 类 X402 流式结算              |
| 更新声誉     | `update_reputation` | ERC-8004-like reputation |






系统架构：
针对三个agent:

Agent Layer
• Sponsorship Agent (赞助商)
• Creator Agent (创作者)
• Consumer Agent (消费者)
• Wallets + ERC-8004 IDs
• Reputation Tracking
+-------------------------------------------------+
Payment Layer (X402)
-------------------------------------------------
• Micro-payment API
• Payment verification
• Transaction logging
+-------------------------------------------------+
Application Layer
-------------------------------------------------
• Content delivery platform
• Agent interaction dashboard
• Bazaar discovery layer
+-------------------------------------------------+
Infrastructure Layer
-------------------------------------------------
• Blockchain (L2 / modular chain)
• Storage (IPFS/Arweave)
• Orchestration & API Gateway
+-------------------------------------------------+




