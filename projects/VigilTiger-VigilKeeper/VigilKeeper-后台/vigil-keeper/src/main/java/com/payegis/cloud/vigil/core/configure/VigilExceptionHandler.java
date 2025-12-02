package com.payegis.cloud.vigil.core.configure;

import com.payegis.cloud.vigil.common.I18nConstant;
import com.payegis.cloud.vigil.core.ret.RetCode;
import com.payegis.cloud.vigil.core.ret.RetResponse;
import com.payegis.cloud.vigil.core.ret.RetResult;
import com.payegis.cloud.vigil.exception.ApplicationException;
import com.payegis.cloud.vigil.service.i18n.MsgSourceService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.NoHandlerFoundException;

@ControllerAdvice
@Slf4j
public class VigilExceptionHandler {
    @Autowired
    private MsgSourceService msgSourceService;

    @ExceptionHandler(Exception.class)
    @ResponseBody
    public RetResult handleException(Exception exception) {
        if(exception instanceof NoHandlerFoundException) {
            log.error("{}",exception.getMessage());
            return RetResponse.makeRsp(RetCode.NOT_FOUND.code,"Invalid request");
        }

        log.error("handleException", exception);
        return RetResponse.makeRsp(RetCode.INTERNAL_SERVER_ERROR.code,msgSourceService.getMsg(I18nConstant.SERVER_ERROR));
    }

    @ExceptionHandler({ApplicationException.class,RuntimeException.class})
    @ResponseBody
    public RetResult handleRunException(RuntimeException exception) {
        log.error("handleRunException",exception);
        if(exception instanceof ApplicationException){
            return handleApplicationException((ApplicationException)exception);
        }else if(exception instanceof HttpMessageNotReadableException) {
            return RetResponse.makeRsp(RetCode.INTERNAL_SERVER_ERROR.code,msgSourceService.getMsg(I18nConstant.PARA_BLANK));
        }
        return RetResponse.makeRsp(RetCode.INTERNAL_SERVER_ERROR.code,msgSourceService.getMsg(I18nConstant.SERVER_ERROR));
    }

    private RetResult handleApplicationException(ApplicationException e) {
        int code = e.getCode();
        String errMsg;
        switch (code) {
            case -402:
                errMsg = msgSourceService.getMsg(I18nConstant.FILE_SIZE);
                break;
            case -403:
                errMsg = msgSourceService.getMsg(I18nConstant.APP_PROTECTED);
                break;
            case -404:
                errMsg = msgSourceService.getMsg(I18nConstant.RECORD_ABSENT);
                break;
            case -405:
                errMsg = msgSourceService.getMsg(I18nConstant.DOWNLOAD_ERROR);
                break;
            case -406:
                errMsg = msgSourceService.getMsg(I18nConstant.APP_PARSE_ERROR);
                break;
            case -407:
                errMsg = msgSourceService.getMsg(I18nConstant.SERVICE_INSUFFICIENT);
                break;
            case -408:
                errMsg = msgSourceService.getMsg(I18nConstant.SERVICE_TIMES_OVER);
                break;
            case -409:
                errMsg = msgSourceService.getMsg(I18nConstant.SERVER_ERROR);
                break;
            case -410:
                errMsg = msgSourceService.getMsg(I18nConstant.FILE_FORMAT,e.getMessage());
                break;
            default:
                errMsg = e.getMessage();
        }

        return RetResponse.makeRsp(code,errMsg);
    }
}
