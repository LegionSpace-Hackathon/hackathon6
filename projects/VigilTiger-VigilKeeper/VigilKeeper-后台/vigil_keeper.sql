/*
 Navicat Premium Data Transfer

 Source Server         : 192.168.83.20
 Source Server Type    : MySQL
 Source Server Version : 50742
 Source Host           : 192.168.83.20:3306
 Source Schema         : vigil_agent

 Target Server Type    : MySQL
 Target Server Version : 50742
 File Encoding         : 65001

 Date: 01/12/2025 14:38:37
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for v_chain_file
-- ----------------------------
DROP TABLE IF EXISTS `v_chain_file`;
CREATE TABLE `v_chain_file`  (
  `id` bigint(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `local_file_name` varchar(128) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '本地文件名',
  `chain_file_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '文件ID',
  `chain_file_name` varchar(128) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '文件名',
  `user_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 101 CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '上传链上会文件关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for v_user
-- ----------------------------
DROP TABLE IF EXISTS `v_user`;
CREATE TABLE `v_user`  (
  `user_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '平台ID',
  `mobile` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '手机号',
  `email` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '邮箱',
  `nick_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '昵称',
  `pwd` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '账号密码',
  `status` tinyint(1) NULL DEFAULT 1 COMMENT '状态 1 激活 0 禁用',
  `create_time` datetime(0) NULL DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime(0) NULL DEFAULT NULL COMMENT '更新时间',
  `source` int(1) NULL DEFAULT 1 COMMENT '来源 1 法务Agent 2',
  PRIMARY KEY (`user_id`) USING BTREE,
  UNIQUE INDEX `unique_mobile`(`mobile`) USING BTREE,
  UNIQUE INDEX `unique_email`(`email`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '用户信息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for v_user_head
-- ----------------------------
DROP TABLE IF EXISTS `v_user_head`;
CREATE TABLE `v_user_head`  (
  `user_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `head_pic` mediumblob NULL COMMENT '头像',
  PRIMARY KEY (`user_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '用户头像表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for v_user_login_record
-- ----------------------------
DROP TABLE IF EXISTS `v_user_login_record`;
CREATE TABLE `v_user_login_record`  (
  `id` bigint(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '平台ID',
  `login_time` datetime(0) NULL DEFAULT NULL COMMENT '第一次登录时间',
  `source` int(1) NULL DEFAULT 1 COMMENT '来源 1 法务Agent 2',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 50 CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '用户登录记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for v_vigil_file
-- ----------------------------
DROP TABLE IF EXISTS `v_vigil_file`;
CREATE TABLE `v_vigil_file`  (
  `file_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '文件ID',
  `file_name` varchar(128) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '文件名',
  `file_path` varchar(128) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '文件路径',
  `file_type` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'pdf/word/excel',
  `file_size` bigint(11) NULL DEFAULT NULL COMMENT '文件大小',
  `match_count` int(11) NULL DEFAULT NULL COMMENT '匹配次数',
  `status` tinyint(1) NULL DEFAULT 1 COMMENT '状态 1 激活 0 禁用',
  `upload_time` datetime(0) NULL DEFAULT NULL COMMENT '上传时间',
  `update_time` datetime(0) NULL DEFAULT NULL COMMENT '更新时间',
  `user_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '用户ID',
  `org_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '组织ID',
  `knowledge_type` char(1) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '知识库类型',
  `chain_file_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '链上会/大群文件ID',
  PRIMARY KEY (`file_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '文件表' ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
