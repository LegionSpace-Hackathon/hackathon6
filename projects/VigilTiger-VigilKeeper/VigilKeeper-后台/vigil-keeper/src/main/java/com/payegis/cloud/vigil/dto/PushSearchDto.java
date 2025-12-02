package com.payegis.cloud.vigil.dto;

import lombok.Data;

@Data
public class PushSearchDto {
    private String UserId;

    private String NavigationTitle;

    private String Title;

    private String Message;

    private String TitleEn;

    private String MessageEn;

    public PushSearchDto() {
    }


    public PushSearchDto(String userId, String navigationTitle, String title, String message, String titleEn, String messageEn) {
        UserId = userId;
        NavigationTitle = navigationTitle;
        Title = title;
        Message = message;
        TitleEn = titleEn;
        MessageEn = messageEn;
    }
}
