package com.payegis.cloud.vigil.mapper;

import com.payegis.cloud.vigil.entity.VigilFile;
import com.payegis.cloud.vigil.entity.VigilFileModule;
import com.payegis.cloud.vigil.vo.VigilFileModuleVo;
import com.payegis.cloud.vigil.vo.VigilFileVo;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

public interface VigilFileMapper {
    int deleteByPrimaryKey(@Param("userId") String userId,@Param("fileId") String fileId);

    int insert(VigilFile record);

    int updateStatus(@Param("userId") String userId,@Param("fileId") String fileId,@Param("status") Boolean status);

    List<VigilFileVo> search(VigilFileVo queryVo);

    List<Map<String,Object>> countByKnowledge(String userId);

    int insertChainFile(@Param("userId") String userId,@Param("localFileName") String localFileName,
                        @Param("chainFileId") String chainFileId,@Param("chainFileName") String chainFileName);
    Map<String,String> selectChainFile(@Param("userId") String userId,@Param("localFileName") String localFileName);

    int insertModule(VigilFileModule entity);
    List<VigilFileModule> getModules(String userId);

    int insertContract(Map<String,Object> map);
    int insertContractLine(Map<String,Object> map);
    int selectContractCount(@Param("fileId") String fileId);
    List<Map<String,Object>> selectContract(@Param("userId") String userId,@Param("contractNumber") String contractNumber);
    List<Map<String,Object>> selectContractLine(@Param("fileId") String fileId);
    List<Map<String,Object>> selectCloseDateline4Alert(@Param("day") int day);
    List<Map<String,Object>> selectCloseDateline4Confirm();
    int updateContractLineAlertStatus(@Param("id") long id);
    int updateContractLineConfirmStatus(@Param("id") long id);
    Integer getConfirmStatus(@Param("id") long id);

    Map<String,Object> selectCloseDateline4AlertByMobile(@Param("mobile") String mobile,@Param("id") Long id);
    Map<String,Object> selectCloseDateline4ConfirmById(@Param("id") Long id);
}