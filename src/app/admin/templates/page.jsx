'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { userApi } from '@/lib/utils/api-client';
import {
  Button,
  TextField,
  Select,
  MenuItem,
  Card,
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon
} from '@mui/icons-material';

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [rules, setRules] = useState([]);

  // 文件导入相关
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  // 加载模板列表
  const loadTemplates = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await userApi.get('/api/admin/templates');

      if (data.success) {
        setTemplates(data.data || []);
      } else {
        setError(data.message || '加载模板失败');
      }
    } catch (err) {
      console.error('加载模板错误:', err);
      setError('加载模板失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 保存模板
  const saveTemplate = async () => {
    if (!formData.name.trim()) {
      setError('应用名称不能为空');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 检查是否存在同名模板（排除当前正在编辑的模板）
      const existingTemplatesResponse = await userApi.get('/api/admin/templates');
      const existingTemplates = existingTemplatesResponse.success
        ? existingTemplatesResponse.data
        : [];
      const existingTemplate = existingTemplates.find(
        (t) =>
          t.name === formData.name && (!isEditing || t.id !== currentTemplate?.id),
      );

      if (existingTemplate) {
        setError('已存在同名模板，请使用其他名称');
        setLoading(false);
        return;
      }

      let url = '/api/admin/templates';
      let method = 'POST';
      let body = { ...formData };

      if (isEditing && currentTemplate) {
        url = `/api/admin/templates/${currentTemplate.id}`;
        method = 'PATCH';
        body.rules = rules;
      }

      const data =
        method === 'POST' ? await userApi.post(url, body) : await userApi.patch(url, body);

      if (data.success) {
        // 如果是创建新模板，并且有规则需要添加
        if (!isEditing && rules.length > 0 && data.data?.id) {
          // 逐个添加规则
          for (const rule of rules) {
            await userApi.post(`/api/admin/templates/${data.data.id}/rules`, rule);
          }
        }

        closeForm();
        loadTemplates();
      } else {
        setError(data.message || '保存模板失败');
      }
    } catch (err) {
      console.error('保存模板错误:', err);
      setError('保存模板失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 删除模板
  const deleteTemplate = async (templateId) => {
    if (!confirm('确定要删除此模板吗？此操作不可恢复。')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await userApi.delete(`/api/admin/templates/${templateId}`);

      if (data.success) {
        loadTemplates();
      } else {
        setError(data.message || '删除模板失败');
      }
    } catch (err) {
      console.error('删除模板错误:', err);
      setError('删除模板失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 添加规则输入
  const addRuleInput = () => {
    setRules([...rules, { type: 'include', mode: 'simple_include', pattern: '', description: '' }]);
  };

  // 移除规则输入
  const removeRuleInput = (index) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  // 更新规则
  const updateRule = (index, field, value) => {
    const updatedRules = [...rules];
    updatedRules[index] = {
      ...updatedRules[index],
      [field]: value,
    };
    setRules(updatedRules);
  };

  // 更新规则类型和模式
  const updateRuleTypeAndMode = (index, value) => {
    const updatedRules = [...rules];
    if (value === 'regex') {
      updatedRules[index] = {
        ...updatedRules[index],
        type: 'include',
        mode: 'regex',
      };
    } else {
      const [type, mode] = value.split('_');
      updatedRules[index] = {
        ...updatedRules[index],
        type: type,
        mode: `simple_${type}`,
      };
    }
    setRules(updatedRules);
  };

  // 开始编辑模板
  const startEditing = (template) => {
    setCurrentTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
    });

    // 转换规则格式，确保 mode 值正确
    const templateRules = template.rules.map((rule) => {
      let mode;
      if (rule.mode === 'regex') {
        mode = 'regex';
      } else {
        mode = `simple_${rule.type}`;
      }

      return {
        type: rule.type,
        mode: mode,
        pattern: rule.pattern,
        description: rule.description,
      };
    });

    setRules(templateRules);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  // 开始创建新模板
  const startCreating = () => {
    setCurrentTemplate(null);
    setFormData({
      name: '',
      description: '',
    });
    setRules([]);
    setIsEditing(false);
    setIsFormOpen(true);
  };

  // 关闭表单
  const closeForm = () => {
    setIsFormOpen(false);
    setCurrentTemplate(null);
    setFormData({
      name: '',
      description: '',
    });
    setRules([]);
    setIsEditing(false);
    setError('');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4, px: 2 }}>
      <Box sx={{ maxWidth: '1536px', mx: 'auto' }}>
        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h4" component="h1">模板管理</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                onClick={() => router.push('/admin')}
                variant="outlined"
                startIcon={<ArrowBackIcon />}
              >
                返回
              </Button>
              <Button
                onClick={startCreating}
                variant="contained"
                color="primary"
                disabled={loading}
                startIcon={<AddIcon />}
              >
                创建模板
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {loading && !isFormOpen ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ mt: 2 }}>加载中...</Typography>
            </Box>
          ) : (
            <>
              {isFormOpen ? (
                <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 1 }}>
                  <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
                    {isEditing ? '编辑模板' : '创建模板'}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                      label="应用名称"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="输入应用名称"
                    />
                    <TextField
                      label="应用描述"
                      multiline
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="输入应用描述"
                    />

                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle1">规则列表</Typography>
                        <Button
                          onClick={addRuleInput}
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<AddIcon />}
                        >
                          添加规则
                        </Button>
                      </Box>

                      {rules.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                          暂无规则，点击"添加规则"按钮添加
                        </Typography>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {rules.map((rule, index) => (
                            <Card key={index} sx={{ p: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="subtitle2">规则 #{index + 1}</Typography>
                                <Button
                                  onClick={() => removeRuleInput(index)}
                                  variant="contained"
                                  color="error"
                                  size="small"
                                >
                                  删除
                                </Button>
                              </Box>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box>
                                  <Typography variant="caption">规则类型</Typography>
                                  <Select
                                    fullWidth
                                    value={rule.mode === 'regex' ? 'regex' : rule.type}
                                    onChange={(e) => updateRuleTypeAndMode(index, e.target.value)}
                                  >
                                    <MenuItem value="include">包含文本</MenuItem>
                                    <MenuItem value="exclude">排除文本</MenuItem>
                                    <MenuItem value="regex">正则表达式</MenuItem>
                                  </Select>
                                </Box>
                                <Box>
                                  <Typography variant="caption">匹配内容 <span style={{ color: 'red' }}>*</span></Typography>
                                  <TextField
                                    fullWidth
                                    value={rule.pattern}
                                    onChange={(e) => updateRule(index, 'pattern', e.target.value)}
                                    placeholder={rule.mode === 'regex' ? '输入正则表达式' : '输入匹配文本'}
                                  />
                                </Box>
                                <Box>
                                  <Typography variant="caption">规则描述</Typography>
                                  <TextField
                                    fullWidth
                                    value={rule.description}
                                    onChange={(e) => updateRule(index, 'description', e.target.value)}
                                    placeholder="输入规则描述"
                                  />
                                </Box>
                              </Box>
                            </Card>
                          ))}
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 3 }}>
                      <Button
                        onClick={closeForm}
                        variant="outlined"
                      >
                        取消
                      </Button>
                      <Button
                        onClick={saveTemplate}
                        variant="contained"
                        color="primary"
                        disabled={loading}
                      >
                        {loading ? '保存中...' : '保存'}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box>
                  {templates.length === 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        暂无模板，点击"创建模板"按钮添加
                      </Typography>
                    </Box>
                  ) : (
                    <Grid container spacing={2}>
                      {templates.map((template) => (
                        <Grid item xs={12} sm={6} md={4} key={template.id}>
                          <Card>
                            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Typography variant="h6">{template.name}</Typography>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <IconButton
                                    onClick={() => startEditing(template)}
                                    color="primary"
                                  >
                                    <EditIcon />
                                  </IconButton>
                                  <IconButton
                                    onClick={() => deleteTemplate(template.id)}
                                    color="error"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
                              </Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {template.description || '无描述'}
                              </Typography>
                            </Box>
                            <Box sx={{ p: 2 }}>
                              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                规则 ({template.rules.length})
                              </Typography>
                              {template.rules.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                  暂无规则
                                </Typography>
                              ) : (
                                <List dense sx={{ maxHeight: 160, overflow: 'auto' }}>
                                  {template.rules.map((rule) => (
                                    <ListItem key={rule.id} sx={{ py: 0.5 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                        <Box
                                          sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            bgcolor: rule.type === 'include' ? 'success.main' : 'error.main',
                                            mr: 1
                                          }}
                                        />
                                        <Typography variant="body2" sx={{ flex: 1 }}>
                                          {rule.type === 'include' ? '包含' : '排除'}: {rule.pattern}
                                        </Typography>
                                      </Box>
                                      {rule.description && (
                                        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                                          {rule.description}
                                        </Typography>
                                      )}
                                    </ListItem>
                                  ))}
                                </List>
                              )}
                            </Box>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              )}
            </>
          )}
        </Card>
      </Box>
    </Box>
  );
}