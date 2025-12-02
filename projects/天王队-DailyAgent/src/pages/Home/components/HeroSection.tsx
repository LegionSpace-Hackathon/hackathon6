import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CanvasBackground from './CanvasBackground';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-slate-900">
      <CanvasBackground />
      
      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-[#15D69C]/10 border border-[#15D69C]/20">
            <span className="text-[#15D69C] font-semibold text-sm uppercase tracking-wider">
              重新定义团队效率
            </span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
        >
          让进度 <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#15D69C] to-[#0EB583]">
            透明可控
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10"
        >
          智能日报与项目进度管理。
          DailyAgent 让日报从"负担"变为"协作工具"，让项目进度从"模糊"变为"透明可控"，助力企业团队提升工作效率与决策质量。
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button 
             onClick={() => navigate('/agent?id=customer-service')}
             className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-[#15D69C] to-[#0EB583] text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(21,214,156,0.4)] transition-all transform hover:-translate-y-1"
          >
            免费试用
          </button>
        </motion.div>

        {/* Stats / Trust badges could go here */}
        {/* <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 1, delay: 1 }}
           className="mt-16 pt-8 border-t border-slate-800/50 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
        >
            {[
                { label: '效率提升', value: '35%' },
                { label: '活跃团队', value: '10k+' },
                { label: '报告生成', value: '1M+' },
                { label: '满意度', value: '99%' }
            ].map((stat, idx) => (
                <div key={idx} className="flex flex-col items-center">
                    <span className="text-3xl font-bold text-white mb-1">{stat.value}</span>
                    <span className="text-sm text-slate-500 uppercase tracking-wide">{stat.label}</span>
                </div>
            ))}
        </motion.div> */}
      </div>
      
      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-slate-600 rounded-full flex justify-center p-1">
          <div className="w-1.5 h-1.5 bg-[#15D69C] rounded-full" />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;

