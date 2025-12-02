
CREATE TABLE `v_user` (
  `user_id` varchar(64) NOT NULL COMMENT '平台ID',
  `mobile` varchar(15) DEFAULT NULL COMMENT '手机号',
  `email` varchar(64) DEFAULT NULL COMMENT '邮箱',
  `nick_name` varchar(64) CHARACTER SET utf8mb4 DEFAULT NULL COMMENT '昵称',
  `pwd` varchar(64) DEFAULT NULL COMMENT '账号密码',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态 1 激活 0 禁用',

  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',

  `source` int(1) DEFAULT 1 COMMENT '来源 1 链上会 2 链上会扫码 3 微信小程序 4 验证码 5 数信云',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `unique_mobile` (`mobile`),
  UNIQUE KEY `unique_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户信息表';

CREATE TABLE `v_user_head` (
  `user_id` varchar(64) NOT NULL,
  `head_pic` mediumblob COMMENT '头像',
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户头像表';

CREATE TABLE `v_user_login_record` (
  `id` bigint(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` varchar(64) COMMENT '平台ID',
  `login_time` datetime COMMENT '第一次登录时间',
  `source` int(1) DEFAULT 1 COMMENT '来源 1 法务Agent 2',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户登录记录表';


CREATE TABLE `v_vigil_file` (
  `file_id` varchar(64) NOT NULL COMMENT '文件ID',
  `file_name` varchar(128) DEFAULT NULL COMMENT '文件名',
  `file_path` varchar(128) DEFAULT NULL COMMENT '文件路径',

  `file_type` varchar(64) DEFAULT NULL COMMENT 'pdf/word/excel',
  `file_size` bigint(11)  COMMENT '文件大小',
  `match_count` int(11) DEFAULT NULL COMMENT '匹配次数',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态 1 激活 0 禁用',

  `upload_time` datetime DEFAULT NULL COMMENT '上传时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',

  `user_id` varchar(64) COMMENT '用户ID',
  `org_id` varchar(32) COMMENT '组织ID',
  `knowledge_type` char(1) COMMENT '知识库类型 1会议纪要 2历史合同 3采购合同模板 4法务知识库',
  `chain_file_id` varchar(64) COMMENT '链上会/大群文件ID',
  PRIMARY KEY (`file_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='文件表';


CREATE TABLE `v_chain_file` (
  `id` bigint(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `local_file_name` varchar(128) DEFAULT NULL COMMENT '本地文件名',
  `chain_file_id` varchar(64) NOT NULL COMMENT '文件ID',
  `chain_file_name` varchar(128) DEFAULT NULL COMMENT '文件名',

  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='上传链上会文件关联表';

alter table v_chain_file add column user_id varchar(64)  COMMENT '用户ID';


INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '《城镇房屋租赁合同（示范文本）》（GF—2025—2614）.docx', '《城镇房屋租赁合同（示范文本）》（GF—2025—2614）.docx', '.docx', NULL, 0, 1, now(), now(), null, NULL, '3', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '《国有建设用地使用权出让合同 （示范文本）》（GF-2025-2601）.doc', '《国有建设用地使用权出让合同 （示范文本）》（GF-2025-2601）.doc', '.doc', NULL, 0, 1, now(), now(), null, NULL, '3', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '《中介合同（示范文本）》（GF—2025—2613）.docx', '《中介合同（示范文本）》（GF—2025—2613）.docx', '.docx', NULL, 0, 1, now(), now(), null, NULL, '3', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '1.《数据提供合同（示范文本）》（GF-2025-2615）.docx', '1.《数据提供合同（示范文本）》（GF-2025-2615）.docx', '.docx', NULL, 0, 1, now(), now(), null, NULL, '3', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '2.《数据委托处理服务合同（示范文本）》（GF-2025-2616）.docx', '2.《数据委托处理服务合同（示范文本）》（GF-2025-2616）.docx', '.docx', NULL, 0, 1, now(), now(), null, NULL, '3', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '3.《数据融合开发合同（示范文本）》（GF-2025-2617）.docx', '3.《数据融合开发合同（示范文本）》（GF-2025-2617）.docx', '.docx', NULL, 0, 1, now(), now(), null, NULL, '3', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '4.《数据中介服务合同（示范文本）》（GF-2025-2618）.docx', '4.《数据中介服务合同（示范文本）》（GF-2025-2618）.docx', '.docx', NULL, 0, 1, now(), now(), null, NULL, '3', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '房屋建筑和市政基础设施项目工程建设全过程咨询服务合同示范文本.doc', '房屋建筑和市政基础设施项目工程建设全过程咨询服务合同示范文本.doc', '.doc', NULL, 0, 1, now(), now(), null, NULL, '3', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '购售电合同示范文本 GF-2021-0511.doc', '购售电合同示范文本 GF-2021-0511.doc', '.doc', NULL, 0, 1, now(), now(), null, NULL, '3', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '建设工程勘察合同　GF—2016—0203.docx', '建设工程勘察合同　GF—2016—0203.docx', '.docx', NULL, 0, 1, now(), now(), null, NULL, '3', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '汽车买卖合同　GF—2015—0121.docx', '汽车买卖合同　GF—2015—0121.docx', '.docx', NULL, 0, 1, now(), now(), null, NULL, '3', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '商品代销合同　GF—2000—1102.docx', '商品代销合同　GF—2000—1102.docx', '.docx', NULL, 0, 1, now(), now(), null, NULL, '3', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '商品房买卖合同（现售）　GF—2014—0172.docx', '商品房买卖合同（现售）　GF—2014—0172.docx', '.docx', NULL, 0, 1, now(), now(), null, NULL, '3', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '商品房买卖合同（预售）　GF—2014—0171.docx', '商品房买卖合同（预售）　GF—2014—0171.docx', '.docx', NULL, 0, 1, now(), now(), null, NULL, '3', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '设备监理合同　GF—2010—1003.docx', '设备监理合同　GF—2010—1003.docx', '.docx', NULL, 0, 1, now(), now(), null, NULL, '3', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '委托合同　GF—2000—1001.docx', '委托合同　GF—2000—1001.docx', '.docx', NULL, 0, 1, now(), now(), null, NULL, '3', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '新能源场站并网调度协议示范文本 GF-2021-0513.doc', '新能源场站并网调度协议示范文本 GF-2021-0513.doc', '.doc', NULL, 0, 1, now(), now(), null, NULL, '3', null);

INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), 'ccpa_statute.pdf', 'ccpa_statute.pdf', '.pdf', NULL, 0, 1, now(), now(), null, NULL, '4', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '关键信息基础设施安全保护条例.pdf', '关键信息基础设施安全保护条例.pdf', '.pdf', NULL, 0, 1, now(), now(), null, NULL, '4', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '互联网信息服务深度合成管理规定.pdf', '互联网信息服务深度合成管理规定.pdf', '.pdf', NULL, 0, 1, now(), now(), null, NULL, '4', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '计算机软件保护条例.pdf', '计算机软件保护条例.pdf', '.pdf', NULL, 0, 1, now(), now(), null, NULL, '4', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '联合国国际货物销售合同公约.pdf', '联合国国际货物销售合同公约.pdf', '.pdf', NULL, 0, 1, now(), now(), null, NULL, '4', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '欧盟《通用数据保护条例》GDPR.pdf', '欧盟《通用数据保护条例》GDPR.pdf', '.pdf', NULL, 0, 1, now(), now(), null, NULL, '4', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '生成式人工智能服务管理暂行办法.pdf', '生成式人工智能服务管理暂行办法.pdf', '.pdf', NULL, 0, 1, now(), now(), null, NULL, '4', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '网络数据安全管理条例.docx', '网络数据安全管理条例.docx', '.docx', NULL, 0, 1, now(), now(), null, NULL, '4', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '信息安全技术 网络安全等级保护基本要求.pdf', '信息安全技术 网络安全等级保护基本要求.pdf', '.pdf', NULL, 0, 1, now(), now(), null, NULL, '4', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '中华人民共和国电子签名法.pdf', '中华人民共和国电子签名法.pdf', '.pdf', NULL, 0, 1, now(), now(), null, NULL, '4', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '中华人民共和国电子商务法.docx', '中华人民共和国电子商务法.docx', '.docx', NULL, 0, 1, now(), now(), null, NULL, '4', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '中华人民共和国反洗钱法.docx', '中华人民共和国反洗钱法.docx', '.docx', NULL, 0, 1, now(), now(), null, NULL, '4', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '中华人民共和国个人信息保护法.pdf', '中华人民共和国个人信息保护法.pdf', '.pdf', NULL, 0, 1, now(), now(), null, NULL, '4', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '中华人民共和国公司法.pdf', '中华人民共和国公司法.pdf', '.pdf', NULL, 0, 1, now(), now(), null, NULL, '4', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '中华人民共和国民法典.docx', '中华人民共和国民法典.docx', '.docx', NULL, 0, 1, now(), now(), null, NULL, '4', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '中华人民共和国民法典-合同编.docx', '中华人民共和国民法典-合同编.docx', '.docx', NULL, 0, 1, now(), now(), null, NULL, '4', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '中华人民共和国民事诉讼法.docx', '中华人民共和国民事诉讼法.docx', '.docx', NULL, 0, 1, now(), now(), null, NULL, '4', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '中华人民共和国民营经济促进法.docx', '中华人民共和国民营经济促进法.docx', '.docx', NULL, 0, 1, now(), now(), null, NULL, '4', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '中华人民共和国数据安全法.pdf', '中华人民共和国数据安全法.pdf', '.pdf', NULL, 0, 1, now(), now(), null, NULL, '4', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '中华人民共和国网络安全法.pdf', '中华人民共和国网络安全法.pdf', '.pdf', NULL, 0, 1, now(), now(), null, NULL, '4', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '中华人民共和国消费者权益保护法.docx', '中华人民共和国消费者权益保护法.docx', '.docx', NULL, 0, 1, now(), now(), null, NULL, '4', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '中华人民共和国消费者权益保护法实施条例 .docx', '中华人民共和国消费者权益保护法实施条例 .docx', '.docx', NULL, 0, 1, now(), now(), null, NULL, '4', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '中华人民共和国证券法.docx', '中华人民共和国证券法.docx', '.docx', NULL, 0, 1, now(), now(), null, NULL, '4', null);
INSERT INTO `v_vigil_file`(`file_id`, `file_name`, `file_path`, `file_type`, `file_size`, `match_count`, `status`, `upload_time`, `update_time`, `user_id`, `org_id`, `knowledge_type`, `chain_file_id`)
VALUES (REPLACE(UUID(), '-', ''), '中华人民共和国仲裁法.docx', '中华人民共和国仲裁法.docx', '.docx', NULL, 0, 1, now(), now(), null, NULL, '4', null);



CREATE TABLE `v_vigil_file_module` (
  `id` bigint(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `module_name` varchar(128)  COMMENT '模块名',
  `user_id` varchar(64)  COMMENT '用户ID',
  `create_time` datetime  COMMENT '创建时间',
  `update_time` datetime  COMMENT '更新时间',

  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='文件模块';

