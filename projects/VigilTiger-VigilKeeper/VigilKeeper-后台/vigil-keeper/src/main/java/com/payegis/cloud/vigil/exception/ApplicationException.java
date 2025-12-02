package com.payegis.cloud.vigil.exception;

import com.payegis.cloud.vigil.common.order.ResultEnum;
import lombok.Data;
import org.springframework.http.HttpStatus;

@Data
public class ApplicationException extends RuntimeException {

    private final Integer code;

    public ApplicationException(ResultEnum resultEnum) {
        super(resultEnum.getMsg());
        this.code = resultEnum.getCode();
    }

    public ApplicationException(String message) {
        super(message);
        this.code = HttpStatus.INTERNAL_SERVER_ERROR.value();
    }

    public ApplicationException(Integer code, String msg) {
        super(msg);
        this.code = code;
    }

    @Override
    public Throwable fillInStackTrace() {
        return null;
    }

}
