{
  "name": "org_member_info_query",
  "description": "查询组织成员基本信息，输出YAML格式结果（包含姓名、所属组织、部门、岗位）",
  "inputSchema": {
    "properties": {
      "member_name": {
        "title": "成员姓名",
        "type": "string"
      },
      "query_scope": {
        "title": "查询范围",
        "type": "string",
        "enum": ["basic_info"],
        "default": "basic_info"
      },
      "strict_mode": {
        "title": "严格模式",
        "type": "boolean",
        "default": false
      }
    },
    "required": ["member_name"],
    "title": "成员信息查询参数",
    "type": "object"
  }
}