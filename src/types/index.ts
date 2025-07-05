/**
 * 创建模板DTO
 */
export interface CreateTemplateDTO {
  name: string;
  description?: string;
  isPublic?: boolean;
  username?: string;
  rules?: Array<{
    mode: string;
    pattern: string;
    description?: string;
  }>;
}

/**
 * 更新模板DTO
 */
export interface UpdateTemplateDTO {
  id: string;
  name?: string;
  description?: string;
  isPublic?: boolean;
  username?: string;
  rules?: Array<{
    mode: string;
    pattern: string;
    description?: string;
  }>;
}

/**
 * 创建卡密链接DTO
 */
export interface CreateCardLinkDTO {
  appName: string;
  phone?: string;
  templateId?: string;
  expiryDays?: number;
  tags?: string[];
  type?: 'email' | 'sms';
}

/**
 * 卡密链接响应DTO
 */
export interface CardLinkResponseDTO {
  id: string;
  cardKey: string;
  username: string;
  appName: string;
  phone: string | null;
  createdAt: string;
  firstUsedAt: string | null;
  url: string;
  templateId?: string;
  expiryDays?: number;
  tags: string[];
  type: 'email' | 'sms';
}
