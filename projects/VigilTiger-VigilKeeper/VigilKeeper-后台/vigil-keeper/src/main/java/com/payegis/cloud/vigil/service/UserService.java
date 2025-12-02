package com.payegis.cloud.vigil.service;

import com.payegis.cloud.vigil.entity.User;
import com.payegis.cloud.vigil.mapper.UserMapper;
import com.payegis.cloud.vigil.utils.*;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class UserService {

    @Resource
    private UserMapper userMapper;


    public User queryUserByEmail(String email){
        return userMapper.selectByEmail(email);
    }

    public User queryUserByUserName(String username){
        return userMapper.selectByUsername(username);
    }

    public User queryUserByMobile(String mobile){
        return userMapper.selectByMobile(mobile);
    }

    public User queryUserByUserId(String userId){
        return userMapper.selectByPrimaryKey(userId);
    }

    public String queryMobileByUserId(String userId){
        return queryUserByUserId(userId).getMobile();
    }

    public List<String> queryIdsByMobiles(List<String> mobiles,List<String> emails){
        if(CollectionUtils.isEmpty(mobiles) && CollectionUtils.isEmpty(emails)) {
            return new ArrayList<>();
        }
        return userMapper.queryIdsByMobiles(mobiles,emails);
    }

    public List<Map<String,Object>> queryByIds(List<String> ids){
        return userMapper.queryByIds(ids);
    }

    public byte[] queryHeadImg(String secretId){
        Map<String, byte[]> map = userMapper.selectHeadImg(secretId);
        return map != null ? map.get("headPic") : null;
    }

    public void updateHead(String userId,byte[] headImg) {
        headImg = ImgUtil.zoomByMaxSize(headImg,300);
        if(headImg == null) {
            return;
        }
        Map<String,Object> map = new HashMap<>();
        map.put("userId",userId);
        map.put("headImg",headImg);
        Map<String,byte[]> headMap = userMapper.selectHeadImg(userId);
        if(headMap == null){
            userMapper.insertHeadImg(map);
        }else{
            //userMapper.updateHeadImg(map);
        }
    }

    public User save(String mobile, String email, String nickName,int source){
        try {
            mobile = StringUtils.isBlank(mobile) ? null : mobile;
            email = StringUtils.isBlank(email) ? null : email;
            User user = new User();
            user.setUserId(CommonStringUtil.get32UUID());
            user.setMobile(mobile);
            user.setEmail(email);
            user.setCreateTime(DateUtil.getCurrentTime());
            user.setStatus(Boolean.TRUE);
            user.setSource(source);
            user.setNickName(nickName);
            userMapper.insertSelective(user);

            return user;
        } catch (Exception e) {
            log.error("save user exception mobile:{} email:{}",mobile,email,e);
        }
        return null;
    }

    public void resetPassword(String userId,String password){
        User user = new User();
        user.setUserId(userId);
        user.setPwd(MD5Util.getMD5(password));
        user.setUpdateTime(DateUtil.getCurrentTime());
        userMapper.updateByPrimaryKeySelective(user);
    }

    public synchronized void saveLoginLog(String userId) {
        if(userMapper.getLoginLogCount(userId)>0) {
            return;
        }
        userMapper.saveLoginLog(userId);
    }

}
