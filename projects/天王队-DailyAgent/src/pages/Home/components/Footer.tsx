import React from 'react';
import { GithubOutlined, TwitterOutlined, LinkedinOutlined } from '@ant-design/icons';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#15D69C] to-[#0EB583] flex items-center justify-center">
                  <span className="text-white font-bold text-xl">D</span>
              </div>
              <span className="text-white font-bold text-xl tracking-tight">DailyAgent</span>
            </div>
            <p className="max-w-xs text-slate-500 mb-6">
              让工作透明、可管理、高效，适用于所有团队。
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#15D69C] hover:text-white transition-all">
                <GithubOutlined />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#15D69C] hover:text-white transition-all">
                <TwitterOutlined />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#15D69C] hover:text-white transition-all">
                <LinkedinOutlined />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4">产品</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-[#15D69C] transition-colors">功能</a></li>
              <li><a href="#scenarios" className="hover:text-[#15D69C] transition-colors">使用场景</a></li>
              <li><a href="#" className="hover:text-[#15D69C] transition-colors">定价</a></li>
              <li><a href="#" className="hover:text-[#15D69C] transition-colors">版本发布</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4">公司</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-[#15D69C] transition-colors">关于</a></li>
              <li><a href="#" className="hover:text-[#15D69C] transition-colors">招聘</a></li>
              <li><a href="#" className="hover:text-[#15D69C] transition-colors">隐私</a></li>
              <li><a href="#" className="hover:text-[#15D69C] transition-colors">条款</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center text-sm">
          <p>© {new Date().getFullYear()} DailyAgent. 保留所有权利。</p>
          <div className="flex gap-6 mt-4 md:mt-0">
             <span>为现代团队设计</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

