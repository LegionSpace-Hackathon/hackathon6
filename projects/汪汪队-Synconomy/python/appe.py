import datetime
import time
import mysql.connector
import requests # 新增：用于发送 HTTP 请求
from bs4 import BeautifulSoup # 新增：用于解析 HTML
import uuid # 新增：用于生成唯一ID
from mcp.server.fastmcp import FastMCP
from decimal import Decimal # 导入 Decimal 类型
from apscheduler.schedulers.background import BackgroundScheduler

mcp = FastMCP("risk-collection-service", port=5000, host="0.0.0.0")

# --- MySQL 数据库配置 (保持您的原样) ---
DB_CONFIG = {
    'host': '192.168.94.62',
    'user': 'hackson',
    'password': 'Tfd@123456',
    'port': 3306,
    'database': 'hackson' # 保持您的 'hackson' 数据库
}

# --- 模拟爬取到的原始数据 (用于定时任务) ---
raw_crawled_data_source = {
    "科技": [
        {
            "id": "tech_005", "industry": "科技", "category": "市场风险", "title": "元宇宙热潮降温，投资转向更实际AI应用",
            "source": "Bloomberg", "publish_date": "2025-11-28",
            "summary": "过去一年元宇宙概念的投资热度明显下降，资金正重新流向生成式AI、边缘计算等具有即时商业价值的技术领域。",
            "url": "https://bloomberg.com/metaverse-ai-shift", "sentiment": "中性"
        },
        {
            "id": "tech_006", "industry": "科技", "category": "政策风险", "title": "欧洲数字市场法案生效，巨头平台业务模式面临调整",
            "source": "Reuters", "publish_date": "2025-11-27",
            "summary": "欧盟《数字市场法案》（DMA）正式生效，对大型科技公司施加更严格的监管，要求开放平台互操作性，可能影响其核心广告和应用商店业务。",
            "url": "https://reuters.com/eu-dma-act", "sentiment": "消极"
        }
    ],
    "金融": [
        {
            "id": "finance_005", "industry": "金融", "category": "宏观经济风险", "title": "全球经济增长放缓预期，企业融资成本上升",
            "source": "IMF Report", "publish_date": "2025-11-28",
            "summary": "国际货币基金组织预测全球经济增长将进一步放缓，导致企业信贷条件收紧，融资难度和成本增加。",
            "url": "https://imf.com/global-outlook", "sentiment": "消极"
        },
        {
            "id": "finance_006", "industry": "金融", "category": "网络安全风险", "title": "某银行客户数据泄露事件，引发监管部门关注",
            "source": "Financial Times", "publish_date": "2025-11-26",
            "summary": "一家知名银行发生大规模客户数据泄露，导致客户信任危机和监管机构的深入调查。事件强调了金融行业在数据保护方面的脆弱性。",
            "url": "https://ft.com/bank-data-breach", "sentiment": "消极"
        }
    ],
    "制造业": [
        {
            "id": "manufacture_005", "industry": "制造业", "category": "环境保护风险", "title": "欧盟碳边境调节机制启动，出口企业面临碳成本",
            "source": "EU News", "publish_date": "2025-11-28",
            "summary": "欧盟碳边境调节机制（CBAM）开始试运行，要求进口高碳产品缴纳碳税，对高排放制造业的出口企业构成新的成本压力和合规挑战。",
            "url": "https://ec.europa.eu/cbam", "sentiment": "消极"
        },
        {
            "id": "manufacture_006", "industry": "制造业", "category": "技术风险", "title": "工业物联网安全漏洞频发，智能工厂面临网络威胁",
            "source": "IoT World", "publish_date": "2025-11-27",
            "summary": "随着工业物联网（IIoT）在制造业的普及，相关的网络安全漏洞也日益增多，对智能工厂的运营安全构成严重威胁。",
            "url": "https://iotworld.com/iiot-security", "sentiment": "消极"
        }
    ]
}


# --- 存储已爬取数据的 ID，用于去重 (仍然需要，因为爬虫可能抓取到重复内容) ---
crawled_ids = set()

# --- 数据库操作辅助函数 ---
def get_db_connection():
    """建立数据库连接"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as err:
        print(f"Error connecting to MySQL: {err}")
        return None

def insert_risk_news_data(data): # 函数名也相应调整
    """将风险情报数据插入到数据库 (表名: risk_news)"""
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor()
        try:
            # 检查数据是否已存在，通过 id 判断 - 保持您的表名 'risk_news'
            check_sql = "SELECT id FROM risk_news WHERE id = %s"
            cursor.execute(check_sql, (data['id'],))
            if cursor.fetchone():
                return

            sql = """
            INSERT INTO risk_news (id, industry, category, title, source, publish_date, summary, url, sentiment)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                data['id'],
                data['industry'],
                data['category'],
                data['title'],
                data['source'],
                data['publish_date'],
                data['summary'],
                data['url'],
                data['sentiment']
            ))
            conn.commit()
            crawled_ids.add(data['id'])
            print(f"  - 成功插入数据库 (risk_news): {data['title']}")
        except mysql.connector.Error as err:
            print(f"Error inserting data into risk_news: {err}")
            conn.rollback()
        finally:
            cursor.close()
            conn.close()

def query_risk_news_data(industry_name, limit=10): # 函数名也相应调整
    """从数据库中查询指定行业的风险情报 (表名: risk_news)"""
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(dictionary=True)
        try:
            # 保持您的表名 'risk_news'
            sql = """
            SELECT id, industry, category, title, source, publish_date, summary, url, sentiment, created_at
            FROM risk_news
            WHERE industry = %s
            ORDER BY publish_date DESC, created_at DESC
            LIMIT %s
            """
            cursor.execute(sql, (industry_name, limit))
            results = cursor.fetchall()
            return results
        except mysql.connector.Error as err:
            print(f"Error querying data from risk_news: {err}")
            return []
        finally:
            cursor.close()
            conn.close()
    return []

# 处理用户账户扣费的函数 (保持原样，只会在 initiate_payment 中调用)
def charge_user_account(user_id: str, amount: Decimal):
    """
    模拟从用户账户扣除费用。
    :return: (bool, str) - (是否成功, 消息)
    """
    conn = get_db_connection()
    if not conn:
        return False, "数据库连接失败。"

    cursor = conn.cursor()
    try:
        # 1. 查询当前余额
        # 注意：user_accounts 表名和 hackson 数据库名是您自行配置的，这里假设它存在
        select_sql = "SELECT balance FROM user_accounts WHERE user_id = %s FOR UPDATE"
        cursor.execute(select_sql, (user_id,))
        result = cursor.fetchone()

        if not result:
            return False, f"用户 {user_id} 不存在。"

        current_balance = Decimal(result[0])

        # 2. 检查余额是否足够
        if current_balance < amount:
            return False, f"余额不足。当前余额: {current_balance:.2f}，需要: {amount:.2f}。"

        # 3. 扣除费用并更新余额
        new_balance = current_balance - amount
        update_sql = "UPDATE user_accounts SET balance = %s WHERE user_id = %s"
        cursor.execute(update_sql, (new_balance, user_id))
        conn.commit()
        print(f"用户 {user_id} 成功扣除 {amount:.2f} 元。新余额: {new_balance:.2f}。")
        return True, f"支付成功！费用 {amount:.2f} 已从您的账户扣除。您的当前余额为 {new_balance:.2f}。"

    except mysql.connector.Error as err:
        print(f"Error processing payment for user {user_id}: {err}")
        conn.rollback()
        return False, f"支付处理失败：{err}"
    finally:
        cursor.close()
        conn.close()


# --- 新增 MCP Tool: 仅用于支付扣款 ---
@mcp.tool()
def initiate_payment(user_id: str, amount: Decimal):
    """
    启动支付流程，从用户账户扣除指定金额。
    :param user_id: 进行支付的用户ID。
    :param amount: 需要扣除的金额。
    :return: 支付结果信息。
    """
    if not user_id:
        return {"error": "Missing user_id for payment."}
    if amount <= Decimal('0'):
        return {"error": "Amount must be positive."}

    payment_success, payment_message = charge_user_account(user_id, amount)

    return {
        "payment_status": "success" if payment_success else "failed",
        "payment_message": payment_message,
        "user_id": user_id,
        "amount": amount.to_eng_string(), # 返回 Decimal 的字符串表示
        "timestamp": datetime.datetime.now().isoformat()
    }


# --- 真实网页爬虫函数示例 (保持不变) ---
def real_web_crawler(target_url: str, industry: str):
    """
    真实的网页爬虫，从指定 URL 爬取新闻标题、链接和摘要。
    此示例仅为演示，实际爬虫需针对具体网站结构编写。
    :param target_url: 目标网页 URL。
    :param industry: 爬取数据所属的行业。
    :return: list of dict - 爬取到的结构化数据列表。
    """
    crawled_data = []
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
        }
        response = requests.get(target_url, headers=headers, timeout=10)
        response.raise_for_status() # 检查 HTTP 错误
        soup = BeautifulSoup(response.text, 'html.parser')

        # 这是一个示例：假设目标页面有一些新闻列表，每个新闻项包含标题和链接
        # 您需要根据实际目标网站的 HTML 结构来修改以下选择器
        # 例如，这里假设是 class 为 'news-item' 的 div，里面有 h3 和 a 标签
        news_items = soup.find_all('div', class_='news-item') # 这是一个虚构的 CSS 类

        if not news_items:
            print(f"Warning: No news items found for {target_url} with class 'news-item'. Trying 'article' tag.")
            # 尝试另一种常见的结构，例如直接找 article 标签
            news_items = soup.find_all('article')


        for item in news_items:
            title_tag = item.find('h3') or item.find('h2') or item.find('a', class_='title')
            link_tag = item.find('a')
            summary_tag = item.find('p', class_='summary') or item.find('div', class_='description')

            title = title_tag.get_text(strip=True) if title_tag else "No Title"
            url = link_tag.get('href') if link_tag else target_url # 如果找不到特定链接，用页面URL
            summary = summary_tag.get_text(strip=True) if summary_tag else title # 简单摘要，或者用标题

            # 确保 URL 是完整的
            if url and not url.startswith('http'):
                url = requests.compat.urljoin(target_url, url)

            # 模拟发布日期和情感
            publish_date = datetime.date.today().isoformat()
            sentiment = "中性" # 默认中性，实际需要NLP分析

            data_item = {
                "id": str(uuid.uuid4()), # 生成唯一ID
                "industry": industry,
                "category": "市场动态", # 简单分类
                "title": title,
                "source": target_url.split('//')[-1].split('/')[0], # 从URL中提取域名作为来源
                "publish_date": publish_date,
                "summary": summary,
                "url": url,
                "sentiment": sentiment
            }
            crawled_data.append(data_item)

    except requests.exceptions.RequestException as e:
        print(f"Error during web crawling for {target_url}: {e}")
    except Exception as e:
        print(f"An unexpected error occurred during parsing for {target_url}: {e}")

    return crawled_data

# --- 定时任务：真实风险收集 (网页爬取到数据库) ---
CRAWLING_TARGETS = [
    {"url": "https://www.ft.com/companies/financial-services", "industry": "金融"},
    {"url": "https://techcrunch.com/", "industry": "科技"},
]

def simulate_web_crawling_to_db():
    """
    模拟定期启动真实网页爬虫，获取数据并存储到 MySQL 数据库。
    """
    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] 后台真实网页爬取任务启动...")
    for target in CRAWLING_TARGETS:
        print(f"  - 正在爬取: {target['url']} ({target['industry']}行业)")
        new_risks = real_web_crawler(target['url'], target['industry'])
        for risk in new_risks:
            if risk["id"] not in crawled_ids:
                insert_risk_news_data(risk) # 注意这里调用的是 insert_risk_news_data
                time.sleep(0.05)

    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] 后台真实网页爬取任务完成。")


# --- MCP Tool: 从数据库中查询原始风险情报 (不再包含支付逻辑) ---
@mcp.tool()
def get_raw_industry_risk_data_from_db(industry_name: str, limit: int = 5):
    """
    从 MySQL 数据库中查询指定行业的最新原始风险情报数据。
    此工具不再处理支付，只返回未经分析的原始数据，不生成报告。
    :param industry_name: 需要查询的行业名称，例如 '科技', '金融', '制造业'。
    :param limit: (可选) 返回的数据条数限制，默认为5条。
    """
    if not industry_name:
        return {"error": "Missing industry_name."}

    print(f"后端从数据库查询行业原始数据：{industry_name}")

    # 2. 风险收集 (从 MySQL 数据库中查询原始数据)
    collected_risks = query_risk_news_data(industry_name, limit) # 注意这里调用的是 query_risk_news_data

    # 将 datetime.date 对象转换为字符串以便 JSON 序列化
    for risk in collected_risks:
        if 'publish_date' in risk and isinstance(risk['publish_date'], datetime.date):
            risk['publish_date'] = risk['publish_date'].isoformat()
        if 'created_at' in risk and isinstance(risk['created_at'], datetime.datetime):
            risk['created_at'] = risk['created_at'].isoformat()

    return {
        "process_status": "data_retrieved",
        "industry_name": industry_name,
        "raw_collected_risk_data": collected_risks, # 返回原始数据列表
        "timestamp": datetime.datetime.now().isoformat()
    }


if __name__ == '__main__':
    conn_test = get_db_connection()
    if conn_test:
        print("--- 数据库连接成功测试！---")
        conn_test.close()
    else:
        print("--- 数据库连接失败测试！请检查DB_CONFIG！---")
    # 初始化并启动定时任务调度器
#    scheduler = BackgroundScheduler()
    # 每 30 秒模拟爬取一次数据并存储到数据库
    # 注意：真实爬取可能需要更长的间隔，并处理反爬机制
#    scheduler.add_job(simulate_web_crawling_to_db, 'interval', seconds=30)
#    scheduler.start()

    print("MCP 服务启动，后台真实网页爬取任务已开始。")
    try:
        mcp.run(transport='sse')
    except (KeyboardInterrupt, SystemExit):
#        scheduler.shutdown()
        print("MCP 服务和后台调度器已关闭。")