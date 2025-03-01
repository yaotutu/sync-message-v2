export type RuleType = 'include' | 'exclude';
export type RuleMode = 'simple' | 'regex';

export interface TemplateRule {
    id: string;           // 规则唯一标识
    order: number;        // 规则优先级
    type: RuleType;       // 规则类型：包含或排除
    mode: RuleMode;       // 规则模式：简单模式或正则模式
    pattern: string;      // 匹配模式（简单文本或正则表达式）
    description: string;  // 规则描述
    isActive: boolean;    // 规则是否启用
}

export interface AppTemplate {
    id: string;           // 模板唯一标识
    name: string;         // 应用名称
    description: string;  // 应用描述
    rules: TemplateRule[]; // 规则列表
    createdAt: string;    // 创建时间
    updatedAt: string;    // 更新时间
}

export interface CreateTemplateDTO {
    name: string;
    description: string;
}

export interface UpdateTemplateDTO {
    name?: string;
    description?: string;
}

export interface CreateRuleDTO {
    type: RuleType;
    mode: RuleMode;
    pattern: string;
    description: string;
}

export interface UpdateRuleDTO {
    order?: number;
    type?: RuleType;
    mode?: RuleMode;
    pattern?: string;
    description?: string;
    isActive?: boolean;
}

// API 响应类型
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
} 