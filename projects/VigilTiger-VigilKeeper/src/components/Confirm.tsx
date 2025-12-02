import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { confirmContract, getConfirmStatus } from '../services/api';
import './Confirm.css';

function Confirm(): JSX.Element {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [id, setId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false); // 是否已完成（data === 1）
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true); // 是否正在加载状态

  useEffect(() => {
    // 从 URL 查询参数中获取数据
    const mobileParam = searchParams.get('mobile') || '';
    const titleParam = searchParams.get('title') || '';
    const contentParam = searchParams.get('content') || '';
    const idParam = searchParams.get('id') || '';

    setMobile(mobileParam);
    setTitle(titleParam);
    setContent(contentParam);
    setId(idParam);

    // 如果有 id，调用获取确认状态接口
    if (idParam) {
      setIsLoadingStatus(true);
      getConfirmStatus(idParam)
        .then((response) => {
          console.log('获取确认状态返回参数:', response);
          // 如果 data 为 1，表示已完成
          if (response === 1) {
            setIsCompleted(true);
          } else {
            setIsCompleted(false);
          }
        })
        .catch((error) => {
          console.error('获取确认状态失败:', error);
          setIsCompleted(false);
        })
        .finally(() => {
          setIsLoadingStatus(false);
        });
    } else {
      setIsLoadingStatus(false);
    }
  }, [searchParams]);

  const handleIncomplete = (): void => {
    // 处理"未完成"按钮点击
    console.log('未完成', { mobile, title, content, id });
    // 这里可以调用 API 或执行其他操作
    alert('已标记为未完成');
  };

  const handleComplete = async (): Promise<void> => {
    // 处理"已完成"按钮点击
    if (!id) {
      alert('缺少合同ID');
      return;
    }

    if (isSubmitting) {
      return; // 防止重复提交
    }

    setIsSubmitting(true);

    try {
      // 调用确认合同接口
      await confirmContract(id);
      alert('已标记为已完成');
      // 可以在这里添加跳转或其他操作
    } catch (error) {
      console.error('确认合同失败:', error);
      alert(error instanceof Error ? error.message : '确认合同失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="confirm-page">
      <div className="confirm-container">
        {/* 顶部手机号显示 */}
        <div className="confirm-header">
          <div className="confirm-mobile">{mobile || '未提供手机号'}</div>
        </div>

        {/* 主体内容 */}
        <div className="confirm-body">
          <div className="confirm-title">{title || '无标题'}</div>
          <div className="confirm-content">{content || '无内容'}</div>
        </div>

        {/* 底部按钮 */}
        {!isLoadingStatus && (
          <div className="confirm-actions">
            {!isCompleted && (
              <button
                type="button"
                className="confirm-button incomplete-button"
                onClick={handleIncomplete}
              >
                未完成
              </button>
            )}
            <button
              type="button"
              className={`confirm-button complete-button ${isCompleted ? 'completed-disabled' : ''}`}
              onClick={handleComplete}
              disabled={isSubmitting || !id || isCompleted}
            >
              {isSubmitting ? '提交中...' : '已完成'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Confirm;

