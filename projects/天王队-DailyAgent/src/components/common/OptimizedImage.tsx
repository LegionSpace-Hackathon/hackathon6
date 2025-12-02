import React, { useState, useCallback, memo } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import 'react-lazy-load-image-component/src/effects/opacity.css';

interface OptimizedImageProps {
  src: string | any; // 支持导入的图片对象
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  'data-index'?: string;
  
  // LazyLoadImage 特有属性
  placeholderSrc?: string;
  fallbackSrc?: string;
  effect?: 'blur' | 'opacity' | 'black-and-white' | undefined;
  threshold?: number;
  delayTime?: number;
  delayMethod?: 'throttle' | 'debounce';
  visibleByDefault?: boolean;
  wrapperProps?: Record<string, any>;
  timeout?: number;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  style = {},
  loading = 'lazy',
  priority = false,
  onLoad,
  onError,
  objectFit = 'contain',
  'data-index': dataIndex,
  placeholderSrc,
  fallbackSrc,
  effect = undefined,
  threshold = 100,
  delayTime = 300,
  delayMethod = 'throttle',
  visibleByDefault = false,
  wrapperProps = {},
  timeout = 10000
}) => {
  const [error, setError] = useState(false);
  
  // 确保图片URL路径正确
  let imageSrc = '';
  
  // 检查src类型和值
  console.debug('OptimizedImage src 类型:', typeof src);
  console.debug('OptimizedImage src 值:', src);
  
  if (typeof src === 'string') {
    if (src.startsWith('http') || src.startsWith('/') || src.startsWith('data:') || src.startsWith('blob:')) {
      imageSrc = src;
    } else {
      imageSrc = `/src/assets/images/${src}`;
    }
  } else if (src && typeof src === 'object') {
    // 如果是导入的图片对象
    imageSrc = src.default || src;
  } else {
    // 图片路径错误
    console.error('无效的图片路径:', src);
    imageSrc = fallbackSrc || '';
  }
  
  // 图片加载完成处理
  const handleLoad = useCallback(() => {
    console.log('✅ 图片加载成功:', imageSrc);
    setError(false);
    onLoad?.();
  }, [onLoad, imageSrc]);

  // 图片加载错误处理
  const handleError = useCallback(() => {
    console.error('❌ 图片加载失败:', src);
    console.error('实际加载路径:', imageSrc);
    setError(true);
    onError?.();
  }, [src, onError, imageSrc]);

  // 计算样式
  const computedStyle: React.CSSProperties = {
    width: width,
    height: height,
    objectFit,
    ...style,
  };

  // 包装器类名
  const wrapperClassName = `optimized-image-wrapper ${className}`;

  // 确保有有效的图片源，如果图片加载失败，尝试回退方案
  let actualSrc = imageSrc;
  if (error && fallbackSrc) {
    actualSrc = fallbackSrc;
  }
  
  // 如果出错，显示错误占位符
  if (error && !fallbackSrc) {
    return (
      <div 
        className={`${wrapperClassName} optimized-image-error`}
        style={{
          ...computedStyle,
          background: '#f8f8f8',
          border: '1px dashed #ddd',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '4px',
          color: '#999',
          fontSize: '12px',
          minHeight: '50px',
          padding: '5px'
        }}
        {...wrapperProps}
      >
        <div>图片加载失败</div>
        {process.env.NODE_ENV !== 'production' && (
          <div style={{ fontSize: '10px', marginTop: '4px', wordBreak: 'break-all' }}>
            {actualSrc}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={wrapperClassName} {...wrapperProps} style={computedStyle}>
      <LazyLoadImage
        src={actualSrc}
        alt={alt}
        effect={effect}
        onLoad={handleLoad}
        onError={handleError}
        placeholderSrc={placeholderSrc}
        visibleByDefault={visibleByDefault || priority}
        threshold={threshold}
        delayMethod={delayMethod}
        delayTime={delayTime}
        style={computedStyle}
        wrapperClassName="optimized-image-lazy-wrapper"
        data-index={dataIndex}
      />
    </div>
  );
};

export default memo(OptimizedImage);