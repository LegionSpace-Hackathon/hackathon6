package com.payegis.cloud.vigil.service;

import com.payegis.cloud.vigil.mapper.VigilFileMapper;
import com.payegis.cloud.vigil.utils.DateUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class MessageService {
    @Value("${legion.msg.mobile}")
    private String mobile;
    @Value("${legion.msg.confirmPage}")
    private String confirmPage;
    @Value("${legion.msg.imgUrl}")
    private String imgUrl;
    @Resource
    private LegionService legionService;
    @Resource
    private VigilFileMapper vigilFileMapper;

    public void sendAlert(String mobile,Long id) {
        Map<String,Object> map = vigilFileMapper.selectCloseDateline4AlertByMobile(mobile,id);
        if(map == null) {
            return;
        }
        String title =  getAlertTitle(map);
        String content = getContent(map);
        legionService.sendOfficialTxtMsg(map.get("mobile").toString(),title,content);
        vigilFileMapper.updateContractLineAlertStatus((Long) map.get("id"));

    }

    public void sendAlert() {
        List<Map<String,Object>> data = vigilFileMapper.selectCloseDateline4Alert(1);
        for(Map<String,Object> map : data) {
            String title =  getAlertTitle(map);
            String content =  getContent(map);
            legionService.sendOfficialTxtMsg(map.get("mobile").toString(),title,content);
            vigilFileMapper.updateContractLineAlertStatus((Long) map.get("id"));
        }

    }

    public void sendConfirm() {
        List<Map<String,Object>> data = vigilFileMapper.selectCloseDateline4Confirm();
        for(Map<String,Object> map : data) {
            String title =  getConfirmTitle(map);
            String content =  getContent(map);
            String mobile = map.get("mobile").toString();
            String urlAddress = String.format(confirmPage,mobile,title,content,map.get("id"));
            legionService.sendOfficialLinkMsg(mobile,urlAddress,title,content,imgUrl);
        }

    }

    public void sendConfirm(Long id) {
        Map<String,Object> map = vigilFileMapper.selectCloseDateline4ConfirmById(id);
        if(map == null) {
            return;
        }
        String title =  getConfirmTitle(map);
        String content =  getContent(map);
        String mobile = map.get("mobile").toString();
        String urlAddress = String.format(confirmPage,mobile,title,content,map.get("id"));
        legionService.sendOfficialLinkMsg(mobile,urlAddress,title,content,imgUrl);

    }

    private String getAlertTitle(Map<String,Object> map) {
        return "【进度提醒】"+map.get("contract_name");
    }

    private String getConfirmTitle(Map<String,Object> map) {
        return "【进度确认】"+map.get("contract_name");
    }

    private String getContent(Map<String,Object> map) {
        return map.get("line_desc")+"("+ DateUtil.formatDate((Date)map.get("line_date"),"yyyy-MM-dd")+")";
    }
}
