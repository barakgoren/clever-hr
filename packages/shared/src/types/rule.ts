export type ConditionType =
  | 'field_equals'
  | 'field_contains'
  | 'file_is_type'
  | 'file_contains_keyword';

export type FileType = 'pdf' | 'doc' | 'docx';

export interface RuleCondition {
  type: ConditionType;
  fieldId: string;
  value?: string;      // field_equals / field_contains / file_contains_keyword
  fileType?: FileType; // file_is_type
}

export interface Rule {
  id: number;
  roleId: number;
  companyId: number;
  name: string;
  score: number;
  conditions: RuleCondition[];
  createdAt: string;
  updatedAt: string;
}

export interface RuleMatchResult {
  ruleId: number;
  ruleName: string;
  score: number;
  matched: boolean;
}
