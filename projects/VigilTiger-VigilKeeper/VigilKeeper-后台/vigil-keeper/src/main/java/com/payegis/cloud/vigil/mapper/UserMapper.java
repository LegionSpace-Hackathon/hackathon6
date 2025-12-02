package com.payegis.cloud.vigil.mapper;

import com.payegis.cloud.vigil.entity.User;
import org.apache.ibatis.annotations.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface UserMapper {
    int deleteByPrimaryKey(String userId);

    int insert(User record);

    int insertSelective(User record);

    User selectByPrimaryKey(String userId);


    int updateByPrimaryKey(User record);

    int updateByPrimaryKeySelective(User record);

    User selectByUsername(@Param(value = "username")String username);

    User selectByEmail(@Param(value = "email")String email);

    User selectByMobile(@Param(value = "mobile")String mobile);

    String queryMobileBySecretId(String userId);
    List<String> queryIdsByMobiles(@Param("mobiles")List<String> mobiles,@Param("emails")List<String> emails);
    List<Map<String,Object>> queryByIds(@Param("ids")List<String> ids);

    int selectCurrentDayCreateCounts();

    int updateNickByPrimaryKey(User user);

    Map<String,byte[]> selectHeadImg(@Param("userId") String userId);

    int insertHeadImg(Map<String,Object> map);

    int updateHeadImg(Map<String,Object> map);

    List<String> getMobiles();

    int updateByMobile(User record);

    int saveLoginLog(@Param("userId") String userId);

    int getLoginLogCount(@Param("userId") String userId);

    List<Map<String,Object>> getNewUser();

    List<Map<String,Object>> getActiveUser();
}