package com.payegis.cloud.vigil.utils;

import com.alibaba.fastjson.JSONObject;
import com.github.pagehelper.PageInfo;

public class PageUtil {
    public static JSONObject formatPageInfo(PageInfo pageInfo){
        JSONObject result = new JSONObject();
        result.put("pageNum",pageInfo.getPageNum());
        result.put("pageSize",pageInfo.getPageSize());
        result.put("pages",pageInfo.getPages());
        result.put("total",pageInfo.getTotal());
        result.put("list",pageInfo.getList());
        return result;
    }
}
