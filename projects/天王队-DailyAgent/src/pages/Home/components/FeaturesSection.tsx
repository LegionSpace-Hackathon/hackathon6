import React from 'react';
import { motion } from 'framer-motion';
import { 
  FormOutlined, 
  ProjectOutlined, 
  BarChartOutlined, 
  TeamOutlined 
} from '@ant-design/icons';

const features = [
  {
    icon: <FormOutlined />,
    title: '结构化日报管理',
    description: '简化日报编写流程，确保信息完整统一。自定义日报模板（支持文本、附件、任务关联、工时统计等字段）、定时提醒提交、日报草稿自动保存、历史记录回溯。',
    color: 'from-blue-500 to-cyan-400'
  },
  {
    icon: <ProjectOutlined />,
    title: '项目进度跟踪',
    description: '可视化呈现项目全生命周期进度，及时识别风险。项目拆解：按模块/任务分配负责人、设置起止时间/优先级；进度同步：关联日报自动更新任务完成状态；多维度视图：列表/看板/甘特图展示项目进度。',
    color: 'from-purple-500 to-pink-400'
  },
  {
    icon: <BarChartOutlined />,
    title: '数据智能汇总',
    description: '减少人工统计成本，输出可决策的数据分析结果。自动汇总团队日报：提取核心成果、待办事项、问题反馈；项目进度报表：生成周/月/季度进度趋势图、任务完成率统计。',
    color: 'from-[#15D69C] to-emerald-400'
  },
  {
    icon: <TeamOutlined />,
    title: '协作联动能力',
    description: '打通日报与项目的协作闭环，避免信息孤岛。日报关联项目/任务：提交日报时直接更新对应任务进度；跨部门协作：支持不同团队共享项目进度、评论互动。',
    color: 'from-orange-500 to-amber-400'
  }
];

const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-24 bg-slate-900 relative">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
      
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            满足规模化所需的 <span className="text-[#15D69C]">一切</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            强大的功能设计，旨在简化您的工作流程并提升团队生产力。
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-2xl hover:border-[#15D69C]/50 transition-colors group"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white text-2xl mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

