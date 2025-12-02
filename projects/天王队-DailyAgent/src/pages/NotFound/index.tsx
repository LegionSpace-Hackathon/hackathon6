import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import './styles.scss';

const NotFound: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1>404</h1>
        <p>页面不存在</p>
        <Link to="/" className="btn btn-primary">
          返回首页
        </Link>
      </div>
    </div>
  );
};

export default NotFound; 