// 通用API响应类型
export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    error?: Error;
}

// 用户相关类型
export interface User {
    id: number;
    username: string;
    webhookKey: string;
    createdAt: number;
}

// 卡密相关类型
export interface CardKey {
    id: number;
    key: string;
    username: string;
    status: 'unused' | 'used' | 'expired';
    createdAt: number;
    usedAt?: number | null;
    expiresIn?: number;
}

// 卡链接相关类型
export interface CardLink {
    id: string;
    key: string;
    username: string;
    appName: string;
    phones?: string[];
    phoneNumbers?: string[]; // 兼容旧代码
    createdAt: number;
    firstUsedAt?: number | null; // 卡密第一次被使用的时间
    url: string;
    templateId?: string;
}

export interface CreateCardLinkDTO {
    appName: string;
    phoneNumbers?: string[] | undefined;
    phones?: string[] | undefined;
    templateId?: string;
}

// 消息相关类型
export interface Message {
    id: number;
    username?: string;
    sms_content: string;
    rec_time: string | null;
    received_at: number;
}

export interface MessageResponse {
    success: boolean;
    data?: Message[];
    message?: string;
    expiresIn?: number;
}

// 模板相关类型
export type RuleType = 'include' | 'exclude';
export type RuleMode = 'simple_include' | 'simple_exclude' | 'regex';

export interface TemplateRule {
    id: string;
    order_num: number;
    type: RuleType;
    mode: RuleMode;
    pattern: string;
    description: string;
    isActive: boolean;
}

export interface AppTemplate {
    id: string;
    name: string;
    description: string;
    rules: TemplateRule[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateTemplateDTO {
    name: string;
    description: string;
}

export interface UpdateTemplateDTO {
    name?: string;
    description?: string;
    rules?: CreateRuleDTO[];
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