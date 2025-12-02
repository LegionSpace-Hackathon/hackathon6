package com.payegis.cloud.vigil.service;

import com.alibaba.fastjson.JSONArray;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import com.payegis.cloud.vigil.entity.User;
import com.payegis.cloud.vigil.entity.VigilFile;
import com.payegis.cloud.vigil.entity.VigilFileModule;
import com.payegis.cloud.vigil.mapper.VigilFileMapper;
import com.payegis.cloud.vigil.utils.CommonStringUtil;
import com.payegis.cloud.vigil.vo.VigilFileVo;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class FileService {
    //https://github.com/imfangs/dify-java-client?tab=readme-ov-file

    @Value("${file.path}")
    private String filePath;
    @Resource
    private CloudApiService cloudApiService;
    @Resource
    private UserService userService;
    @Resource
    private VigilFileMapper vigilFileMapper;


    public PageInfo<VigilFileVo> pageFile(VigilFileVo queryVo) {
        PageHelper.startPage(queryVo.getPageNum(),queryVo.getPageSize());
        List<VigilFileVo> vos = vigilFileMapper.search(queryVo);
        return new PageInfo<>(vos);
    }

    public void save(VigilFile vigilFile) {
        vigilFile.setFileId(CommonStringUtil.get32UUID());
        vigilFile.setUploadTime(new Date());
        vigilFile.setUpdateTime(new Date());
        vigilFile.setMatchCount(0);
        vigilFile.setStatus(true);
        vigilFileMapper.insert(vigilFile);
    }

    public void save(String userId,String fileId,String fileName) {
        VigilFile vigilFile = new VigilFile();
        vigilFile.setUserId(userId);
        vigilFile.setFileId(fileId);
        vigilFile.setFileName(fileName);
        vigilFile.setUploadTime(new Date());
        vigilFile.setUpdateTime(new Date());
        vigilFile.setMatchCount(0);
        vigilFile.setStatus(true);
        vigilFileMapper.insert(vigilFile);
    }

    public void updateStatus(String userId,String fileId,Boolean status) {
        vigilFileMapper.updateStatus(userId,fileId,status);
    }

    public void delete(String userId,String fileId) {
        vigilFileMapper.deleteByPrimaryKey(userId,fileId);
    }

    public JSONArray listOrg(String userId) {
        User user = userService.queryUserByUserId(userId);
        if(user == null || StringUtils.isBlank(user.getMobile())) {
            return new JSONArray();
        }
        //获取该手机号加入的组织ID
        return cloudApiService.listOrg(user.getMobile(),user.getEmail());
    }

    public List<Map<String,Object>> countByKnowledge(String userId) {
        return vigilFileMapper.countByKnowledge(userId);
    }

    public void addModule(VigilFileModule entity) {
        vigilFileMapper.insertModule(entity);
    }

    public List<VigilFileModule> listModule(String userId) {
        return vigilFileMapper.getModules(userId);
    }

}
