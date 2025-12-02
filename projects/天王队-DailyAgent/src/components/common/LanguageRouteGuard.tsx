import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * 语言路由守卫组件
 * 监听路由变化，确保URL中始终包含lang参数
 */
const LanguageRouteGuard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  useEffect(() => {
    // 检查当前URL是否包含lang参数
    const currentSearch = new URLSearchParams(location.search);
    const hasLangParam = currentSearch.has('lang');
    
    if (!hasLangParam) {
      // 添加lang参数
      currentSearch.set('lang', i18n.language);
      
      // 构建新的URL
      const newSearch = currentSearch.toString();
      const newUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`;
      
      console.log('LanguageRouteGuard: 添加lang参数', {
        from: location.pathname + location.search,
        to: newUrl,
        lang: i18n.language
      });
      
      // 使用navigate进行无刷新跳转
      navigate(newUrl, { replace: true });
    }
  }, [location.pathname, location.search, i18n.language, navigate]);

  // 这个组件不渲染任何内容
  return null;
};

export default LanguageRouteGuard;
