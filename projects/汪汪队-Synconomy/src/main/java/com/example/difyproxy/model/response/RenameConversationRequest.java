package com.example.difyproxy.model.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;

/**
 * @author hongli.zhang
 * @create date 2025/9/15
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RenameConversationRequest {
    @NotBlank(message = "会话名称不能为空")
    private String name;
}
