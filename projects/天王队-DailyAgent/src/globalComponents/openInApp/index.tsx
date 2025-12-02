import React, { useState, useEffect, useImperativeHandle } from "react";
import { useTranslation } from "react-i18next";
import  "./index.scss";
import {
  callUrlScheme,
  invokeAppFailCallback,
} from "../../utils/chainpal-utils-0.0.4";
import { IsWeChat, getUAType } from "../../utils/uaHelper";

interface OpenInAppProps {
  className?: string;
  onOpenInApp?: () => void;
  onDownload?: () => void;
}

/**
 * OpenInApp组件 - 提示用户在APP中打开
 * 显示APP图标、说明文本和"在APP内打开"按钮
 * 支持H5和PC端不同的引导方式
 */
const OpenInApp = React.forwardRef<{ handleOpenInApp: () => void }, OpenInAppProps>(({ 
  className = "",
  onOpenInApp,
  onDownload 
}, ref) => {
  const { t } = useTranslation();
  const [isShowWXTip, setIsShowWXTip] = useState(false);
  const [isShowDownloadTip, setIsShowDownloadTip] = useState(false);
  const [isShowPcTip, setIsShowPcTip] = useState(false);

  // 处理在APP内打开的点击事件
  const handleOpenInApp = () => {
    if (IsWeChat) {
      setIsShowWXTip(true);
      return;
    }

    // // 判断路径是否有formUrl字段
    // let url = window.location.origin;
    // if (window.location.search.includes("formUrl")) {
    //   url = window.location.origin + window.location.search.split("formUrl=")[1];
    // } else {
    //   url = window.location.origin;
    // }
    // console.log("Opening URL in app:", url);
    callUrlScheme("openUrl", { url: window.location.href }, (res: boolean) => {
      if (res) {
        invokeAppFailCallback();
      }
    });

    // 调用外部回调
    onOpenInApp?.();
  };


  // 关闭提示
  const closeTip = () => {
    setIsShowWXTip(false);
    setIsShowDownloadTip(false);
    setIsShowPcTip(false);
  };

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    handleOpenInApp: () => {
      handleOpenInApp();
    }
  }));

  return (
    <div className={`container ${!isShowWXTip ? "containerShow" : ""} ${className}`}>
      {/* 微信中弹层提示浏览器打开 */}
      {IsWeChat && isShowWXTip && (
        <div className={"header-tip-wrap"}>
          <div
            className={"header-tip"}
            dangerouslySetInnerHTML={{ __html: t("common.clickMoreTip") }}
          />
          <button 
            className={"close-btn"}
            onClick={closeTip}
            aria-label="关闭提示"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
});

export default OpenInApp;
