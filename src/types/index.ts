/**
 * 创建模板DTO
 */
export interface CreateTemplateDTO {
  name: string;
  description?: string;
  isPublic?: boolean;
  username?: string;
  rules?: Array<{
    type: string;
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
    type: string;
    mode: string;
    pattern: string;
    description?: string;
  }>;
}
