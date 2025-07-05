/**
 * API客户端工具
 * 提供统一的API请求函数，自动添加认证头
 */

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  username?: string;
  password?: string;
};

/**
 * 发送API请求
 * @param url API路径
 * @param options 请求选项
 * @returns 响应数据
 */
export async function apiRequest<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, username, password } = options;

  // 构建请求头
  const requestHeaders: Record<string, string> = {
    ...headers,
  };

  // 如果提供了用户名和密码，添加认证头
  if (username && password) {
    requestHeaders['x-username'] = username;
    requestHeaders['x-password'] = password;
  }

  // 如果是JSON请求，添加Content-Type头
  if (body && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  // 构建请求选项
  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
  };

  // 如果有请求体，添加到请求选项
  if (body) {
    requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    // 发送请求
    const response = await fetch(url, requestOptions);

    // 解析响应
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error(`API请求错误 (${method} ${url}):`, error);
    throw error;
  }
}

/**
 * 获取用户认证信息
 * @returns 用户名和密码
 */
export function getUserAuth(): { username: string; password: string } | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedAuth = localStorage.getItem('user_auth');
    if (!storedAuth) return null;

    const auth = JSON.parse(storedAuth);
    if (!auth.username || !auth.password) return null;

    return {
      username: auth.username,
      password: auth.password,
    };
  } catch (error) {
    console.error('获取用户认证信息失败:', error);
    return null;
  }
}

/**
 * 获取管理员认证信息
 * @returns 管理员密码
 */
export function getAdminAuth(): { password: string } | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedAuth = localStorage.getItem('admin_auth');
    if (!storedAuth) return null;

    const auth = JSON.parse(storedAuth);
    if (!auth.password) return null;

    return {
      password: auth.password,
    };
  } catch (error) {
    console.error('获取管理员认证信息失败:', error);
    return null;
  }
}

/**
 * 用户API请求
 * 自动添加用户认证头
 */
export const userApi = {
  /**
   * 发送GET请求
   */
  async get<T = any>(url: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    const auth = getUserAuth();
    const headers = {
      ...options.headers,
    };

    if (auth?.username && auth?.password) {
      headers['x-username'] = auth.username;
      headers['x-password'] = auth.password;
    }

    return apiRequest<T>(url, {
      ...options,
      method: 'GET',
      headers,
    });
  },

  /**
   * 发送POST请求
   */
  async post<T = any>(
    url: string,
    body: any,
    options: Omit<RequestOptions, 'method' | 'body'> = {},
  ): Promise<T> {
    const auth = getUserAuth();
    const headers = {
      ...options.headers,
    };

    if (auth?.username && auth?.password) {
      headers['x-username'] = auth.username;
      headers['x-password'] = auth.password;
    }

    return apiRequest<T>(url, {
      ...options,
      method: 'POST',
      body,
      headers,
    });
  },

  /**
   * 发送DELETE请求
   */
  async delete<T = any>(
    url: string,
    body: any,
    options: Omit<RequestOptions, 'method' | 'body'> = {},
  ): Promise<T> {
    const auth = getUserAuth();
    const headers = {
      ...options.headers,
    };

    if (auth?.username && auth?.password) {
      headers['x-username'] = auth.username;
      headers['x-password'] = auth.password;
    }

    return apiRequest<T>(url, {
      ...options,
      method: 'DELETE',
      body,
      headers,
    });
  },

  /**
   * 发送PATCH请求
   */
  async patch<T = any>(
    url: string,
    body: any,
    options: Omit<RequestOptions, 'method' | 'body'> = {},
  ): Promise<T> {
    const auth = getUserAuth();
    const headers = {
      ...options.headers,
    };

    if (auth?.username && auth?.password) {
      headers['x-username'] = auth.username;
      headers['x-password'] = auth.password;
    }

    return apiRequest<T>(url, {
      ...options,
      method: 'PATCH',
      body,
      headers,
    });
  },
};

/**
 * 管理员API请求
 * 自动添加管理员认证头
 */
export const adminApi = {
  /**
   * 发送GET请求
   */
  async get<T = any>(url: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    const auth = getAdminAuth();
    const headers = {
      ...options.headers,
    };

    if (auth?.password) {
      headers['x-admin-password'] = auth.password;
    }

    return apiRequest<T>(url, {
      ...options,
      method: 'GET',
      headers,
    });
  },

  /**
   * 发送POST请求
   */
  async post<T = any>(
    url: string,
    body: any,
    options: Omit<RequestOptions, 'method' | 'body'> = {},
  ): Promise<T> {
    const auth = getAdminAuth();
    const headers = {
      ...options.headers,
    };

    if (auth?.password) {
      headers['x-admin-password'] = auth.password;
    }

    return apiRequest<T>(url, {
      ...options,
      method: 'POST',
      body,
      headers,
    });
  },

  /**
   * 发送PATCH请求
   */
  async patch<T = any>(
    url: string,
    body: any,
    options: Omit<RequestOptions, 'method' | 'body'> = {},
  ): Promise<T> {
    const auth = getAdminAuth();
    const headers = {
      ...options.headers,
    };

    if (auth?.password) {
      headers['x-admin-password'] = auth.password;
    }

    return apiRequest<T>(url, {
      ...options,
      method: 'PATCH',
      body,
      headers,
    });
  },

  /**
   * 发送DELETE请求
   */
  async delete<T = any>(url: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    const auth = getAdminAuth();
    const headers = {
      ...options.headers,
    };

    if (auth?.password) {
      headers['x-admin-password'] = auth.password;
    }

    return apiRequest<T>(url, {
      ...options,
      method: 'DELETE',
      headers,
    });
  },
};
