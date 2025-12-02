import React from 'react';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import ScenariosSection from './components/ScenariosSection';
import Footer from './components/Footer';

const Home: React.FC = () => {
  // 覆盖全局的 overflow: hidden，允许首页滚动
  React.useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    
    // 保存原始样式
    const originalHtmlOverflow = html.style.overflow;
    const originalBodyOverflow = body.style.overflow;
    const originalRootOverflow = root?.style.overflow;
    
    // 允许滚动
    html.style.overflow = 'auto';
    body.style.overflow = 'auto';
    if (root) root.style.overflow = 'auto';
    
    return () => {
      // 恢复原始样式
      html.style.overflow = originalHtmlOverflow;
      body.style.overflow = originalBodyOverflow;
      if (root) root.style.overflow = originalRootOverflow || '';
    };
  }, []);


  return (
    <div className="bg-slate-900 text-slate-200 font-sans selection:bg-[#15D69C] selection:text-white h-screen">
      <HeroSection />
      {/* <FeaturesSection /> */}
      <ScenariosSection />
      {/* <Footer /> */}
    </div>
  );
};

export default Home;

