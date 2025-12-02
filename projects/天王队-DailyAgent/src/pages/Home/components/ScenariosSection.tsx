import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserOutlined, ApartmentOutlined, RocketOutlined } from '@ant-design/icons';
import clsx from 'clsx';
import './index.scss';
const scenarios = [
  {
    id: 'employee',
    label: '员工',
    icon: <UserOutlined />,
    title: '专注工作，而非报告',
    items: [
      '每日快速提交工作成果、待办事项、遇到的问题',
      '跟踪自己负责的项目任务进度，同步协作需求',
      '实时同步协作需求，提升沟通效率',
      '自动生成周报摘要，回顾工作成果'
    ],
    image: 'bg-gradient-to-br from-blue-900/40 to-slate-900' // Placeholder for UI screenshot
  },
  {
    id: 'manager',
    label: '团队管理者',
    icon: <ApartmentOutlined />,
    title: '掌控团队动态',
    items: [
      '批量查看团队日报，快速掌握成员工作状态',
      '实时监控项目进度，识别延期风险并协调资源',
      '识别风险并协调资源，确保项目顺利推进',
      '数据驱动的绩效评估，为决策提供依据'
    ],
    image: 'bg-gradient-to-br from-[#15D69C]/20 to-slate-900' // Placeholder
  },
  {
    id: 'project_lead',
    label: '项目负责人',
    icon: <RocketOutlined />,
    title: '推动项目成功',
    items: [
      '拆解项目任务、分配责任，设置进度节点',
      '设置里程碑并跟踪依赖关系',
      '生成项目进度报表，向上级汇报项目进展',
      '透明的任务生命周期管理，确保进度可控'
    ],
    image: 'bg-gradient-to-br from-purple-900/40 to-slate-900' // Placeholder
  }
];



const ScenariosSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section id="scenarios" className="py-24 bg-slate-900 overflow-hidden h-screen">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            为每个角色 <span className="text-[#15D69C]">量身定制</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            无论您是执行任务还是制定策略，DailyAgent 都能适应您的需求。
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Tabs */}
          <div className="w-full lg:w-1/3 space-y-4">
            {scenarios.map((scenario, index) => (
              <button
                key={scenario.id}
                onClick={() => setActiveTab(index)}
                className={clsx(
                  'w-full flex items-center p-6 rounded-xl transition-all duration-300 text-left border',
                  activeTab === index
                    ? 'bg-slate-800 border-[#15D69C] shadow-[0_0_20px_rgba(21,214,156,0.1)]'
                    : 'bg-slate-800/30 border-slate-700 hover:bg-slate-800/60 hover:border-slate-600'
                )}
              >
                <div className={clsx(
                  'w-12 h-12 rounded-lg flex items-center justify-center text-xl mr-4 transition-colors',
                  activeTab === index ? 'bg-[#15D69C] text-white' : 'bg-slate-700 text-slate-400'
                )}>
                  {scenario.icon}
                </div>
                <div>
                  <h3 className={clsx(
                    'font-bold text-lg',
                    activeTab === index ? 'text-white' : 'text-slate-300'
                  )}>
                    {scenario.label}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    适用于{scenario.label}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="w-full lg:w-2/3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="scenario-card-wrapper relative bg-slate-800 rounded-2xl border border-slate-700 p-8 md:p-12 min-h-[400px] flex flex-col md:flex-row gap-8 items-center"
              >
                {/* 粒子边框效果 */}
                <div className="particle-border">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div
                      key={i}
                      className="particle"
                      style={{
                        animationDelay: `${i * 0.4}s`
                      } as React.CSSProperties}
                    />
                  ))}
                </div>
                <div className="flex-1 space-y-6">
                  <h3 className="text-2xl font-bold text-white">{scenarios[activeTab].title}</h3>
                  <ul className="space-y-4">
                    {scenarios[activeTab].items.map((item, i) => (
                      <li key={i} className="flex items-start text-slate-300">
                        <span className="w-6 h-6 rounded-full bg-[#15D69C]/20 text-[#15D69C] flex items-center justify-center text-sm mr-3 mt-0.5">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Visual Representation Placeholder */}
                <div className={`w-full md:w-1/2 aspect-square md:aspect-auto md:h-full rounded-xl ${scenarios[activeTab].image} flex items-center justify-center relative overflow-hidden group`}>
                    <div className="absolute inset-0 bg-[url('https://assets.codepen.io/1462889/grid.png')] opacity-20"></div>
                    {/* Mock UI Element */}
                    <div className="w-3/4 h-3/4 bg-slate-900 rounded-lg shadow-2xl border border-slate-700 p-4 transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
                        <div className="w-1/3 h-2 bg-slate-700 rounded mb-4"></div>
                        <div className="w-full h-1 bg-slate-800 rounded mb-2"></div>
                        <div className="w-full h-1 bg-slate-800 rounded mb-2"></div>
                        <div className="w-2/3 h-1 bg-slate-800 rounded mb-2"></div>
                        
                        <div className="mt-6 flex gap-2">
                           <div className="w-8 h-8 rounded-full bg-slate-700"></div>
                           <div className="flex-1 space-y-2 pt-1">
                               <div className="w-full h-1 bg-slate-800 rounded"></div>
                               <div className="w-1/2 h-1 bg-slate-800 rounded"></div>
                           </div>
                        </div>
                    </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScenariosSection;

