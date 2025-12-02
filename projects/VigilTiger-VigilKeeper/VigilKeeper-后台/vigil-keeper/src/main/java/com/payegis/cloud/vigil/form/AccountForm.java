package com.payegis.cloud.vigil.form;

import lombok.Data;

@Data
public class AccountForm {
    String nick;
    String headUrl;
    String base64Code;
    Boolean loginSet = false;
}
