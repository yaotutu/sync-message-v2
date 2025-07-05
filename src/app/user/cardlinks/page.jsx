'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CardLink, Template as AppTemplate } from '@prisma/client';
import { userApi } from '@/lib/utils/api-client';
import { copyToClipboard } from '@/lib/utils/clipboard';
import TagManagerDialog from '@/components/TagManagerDialog';
import {
  Box,
  Button,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Stack,
  Chip,
  Divider,
  Pagination,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Link,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import LabelIcon from '@mui/icons-material/Label';

export default function CardLinksPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'sms';
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [phones, setPhones] = useState(['']);
  // 用于存储用户选择的邮箱
  const [emails, setEmails] = useState([]);
  // 用于给checkbox提供可选的邮箱列表
  const [emailOptions, setEmailOptions] = useState([]);
  const [groupCountInput, setGroupCountInput] = useState('1');
  const [groupCount, setGroupCount] = useState(1);
  const [expiryDays, setExpiryDays] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [userTags, setUserTags] = useState([]);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [error, setError] = useState('');
  const [cardLinks, setCardLinks] = useState([]);
  const [filteredCardLinks, setFilteredCardLinks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('unused');
  const [tagFilter, setTagFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({ totalPages: 0, page: 1, pageSize: 10, total: 0 });
  const [templates, setTemplates] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loopMode, setLoopMode] = useState('sequence');
  const [templateFilter, setTemplateFilter] = useState('');

  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
  });
  const [alertDialog, setAlertDialog] = useState({
    open: false,
    title: '',
    message: '',
    severity: 'info',
  });

  const router = useRouter();

  // Dialog handlers
  const showConfirmDialog = (title, message, onConfirm) => {
    setConfirmDialog({ open: true, title, message, onConfirm });
  };

  const showAlertDialog = (title, message, severity = 'info') => {
    setAlertDialog({ open: true, title, message, severity });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
  };

  const closeAlertDialog = () => {
    setAlertDialog({ open: false, title: '', message: '', severity: 'info' });
  };

  const handleConfirm = () => {
    if (confirmDialog.onConfirm) {
      confirmDialog.onConfirm();
    }
    closeConfirmDialog();
  };

  // 手机号本地缓存
  useEffect(() => {
    const cached = localStorage.getItem('cached_phones');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPhones(parsed);
        }
      } catch {}
    }
    loadTemplates();
    loadUserTags();
    // 初始加载卡密链接列表
    loadCardLinks();
  }, []);

  useEffect(() => {
    setFilteredCardLinks(cardLinks);
  }, [cardLinks]);

  // 获取用户优先列表
  useEffect(() => {
    userApi.get('/api/user/profile').then((data) => {
      if (data.success) {
        console.log('获取用户优先列表成功', data.data);
        // 这是供用户选择的邮箱列表
        setEmailOptions(data.data.emails || []);
        // 如果用户无可用邮箱，则不做任何操作
      }
    });
  }, []);

  const savePhonesToCache = (phones) => {
    try {
      const toSave = phones.filter((p) => p.trim() !== '');
      localStorage.setItem('cached_phones', JSON.stringify(toSave));
    } catch {}
  };

  // 手机号校验
  const isValidPhone = (phone) => /^1\d{10}$/.test(phone);

  // 验证邮箱格式
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // 加载模板
  const loadTemplates = async () => {
    try {
      const data = await userApi.get('/api/templates');
      if (data.success) {
        const templates = data.data || [];
        setTemplates(templates);
        if (templates.length === 0) {
          setError('暂无应用模版，请回到上级页面创建模版或者联系管理员创建模版');
        }
      } else {
        setError(data.message || '加载模板失败');
      }
    } catch {
      setError('加载模板失败，请检查网络连接');
    }
  };

  // 加载用户标签
  const loadUserTags = async () => {
    try {
      const data = await userApi.get('/api/user/profile');
      if (data.success) {
        setUserTags(data.data.cardLinkTags || []);
      }
    } catch {
      console.error('加载用户标签失败');
    }
  };

  // 处理标签更新
  const handleTagsChange = (updatedTags) => {
    setUserTags(updatedTags);
  };

  /**
   * 加载卡密链接列表
   * @param {Object} options - 加载选项
   * @param {number} options.page - 页码，默认为1
   * @param {boolean} options.append - 是否追加到现有列表，默认为false（替换现有列表）
   * @param {string} options.status - 状态筛选：'all' | 'used' | 'unused'，默认使用当前状态筛选
   * @param {string} options.search - 搜索关键词，默认使用当前搜索条件
   * @param {string} options.tag - 标签筛选，默认使用当前标签筛选
   * @param {string} options.templateId - 模板筛选，默认使用当前模板筛选
   */
  const loadCardLinks = async (options = {}) => {
    // 解构参数，设置默认值
    const {
      page = 1,
      append = false,
      status = statusFilter,
      search = searchQuery,
      tag = tagFilter,
      templateId = templateFilter,
      type: typeParam = type,
    } = options;

    try {
      // 设置加载状态
      setIsLoading(true);
      setIsLoadingMore(append);
      setError('');

      // 验证状态参数的有效性
      const validStatus = ['all', 'used', 'unused'].includes(status) ? status : 'unused';

      // 构建API请求URL
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('pageSize', pagination.pageSize.toString());

      // 添加状态筛选参数（排除'all'状态）
      if (validStatus !== 'all') {
        queryParams.append('status', validStatus);
      }

      // 添加搜索参数
      if (search && search.trim()) {
        queryParams.append('search', search.trim());
      }

      // 添加标签筛选参数
      if (tag && tag.trim()) {
        queryParams.append('tag', tag.trim());
      }

      // 添加模板筛选参数
      if (templateId && templateId.trim()) {
        queryParams.append('templateId', templateId.trim());
      }

      // 添加类型筛选参数
      if (typeParam && typeParam.trim()) {
        queryParams.append('type', typeParam.trim());
      }

      // 添加时间戳防止缓存
      queryParams.append('_t', Date.now().toString());

      const apiUrl = `/api/user/cardlinks?${queryParams.toString()}`;

      // 发送API请求
      const data = await userApi.get(apiUrl);

      if (data.success) {
        // 处理返回的数据
        if (append) {
          // 追加模式：将新数据添加到现有列表末尾
          setCardLinks((prevCardLinks) => [...prevCardLinks, ...data.data]);
        } else {
          // 替换模式：用新数据替换现有列表
          setCardLinks(data.data || []);
        }

        // 更新分页信息
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        // API返回错误
        setError(data.message || '加载卡密链接失败');
      }
    } catch (error) {
      // 网络错误或其他异常
      console.error('加载卡密链接时发生错误:', error);
      setError('加载卡密链接失败，请检查网络连接');
    } finally {
      // 清理加载状态
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  /**
   * 搜索卡密链接
   * @param {Event} e - 表单提交事件
   */
  const handleSearch = (e) => {
    e.preventDefault();
    setIsSearching(true);
    // 使用当前搜索条件重新加载第一页数据
    loadCardLinks({ page: 1, search: searchQuery }).finally(() => setIsSearching(false));
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  /**
   * 切换页码
   * @param {number} newPage - 新的页码
   */
  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadCardLinks({ page: newPage });
    }
  };

  // 添加/删除手机号
  const addPhoneInput = () => setPhones([...phones, '']);

  const removePhoneInput = (index) => {
    if (phones.length > 1) {
      const newPhones = phones.filter((_, i) => i !== index);
      setPhones(newPhones);
      savePhonesToCache(newPhones);
    }
  };

  const updatePhone = (index, value) => {
    const newPhones = [...phones];
    newPhones[index] = value;
    setPhones(newPhones);
    savePhonesToCache(newPhones);
  };

  // 生成手机卡密链接
  const generatePhoneCardLink = async () => {
    if (!selectedTemplate) {
      setError('请选择应用模板');
      return;
    }

    const validPhones = phones.filter((phone) => phone.trim() && isValidPhone(phone));
    const hasInvalidInput = phones.some((phone) => phone.trim() && !isValidPhone(phone));

    if (hasInvalidInput) {
      setError('请检查输入的手机号格式');
      return;
    }

    if (validPhones.length === 0) {
      setError('请至少输入一个有效手机号');
      return;
    }

    if (groupCount < 1) {
      setError('组数必须大于0');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const templateName = templates.find((t) => t.id === selectedTemplate)?.name;
      if (!templateName) {
        setError('无法获取所选模板的名称');
        setIsLoading(false);
        return;
      }

      let phoneList = [];
      if (loopMode === 'sequence') {
        // 顺序循环：ABCABCABC
        for (let i = 0; i < groupCount; i++) {
          phoneList.push(...validPhones);
        }
      } else if (loopMode === 'group') {
        // 分组循环：AAABBBCCC
        for (let i = 0; i < validPhones.length; i++) {
          for (let j = 0; j < groupCount; j++) {
            phoneList.push(validPhones[i]);
          }
        }
      }

      const creationPromises = phoneList.map((phone) =>
        userApi.post('/api/user/cardlinks', {
          appName: templateName,
          phone,
          templateId: selectedTemplate,
          expiryDays: expiryDays.trim() || undefined,
          tags: selectedTags,
          type: type,
        }),
      );

      const results = await Promise.all(creationPromises);
      const failedResults = results.filter((result) => !result.success);

      if (failedResults.length > 0) {
        setError(`创建卡链接部分失败: ${failedResults[0].message}`);
      } else {
        const newLinks = results.map((result) => result.data.url).join('\n');
        try {
          const success = await copyToClipboard(
            newLinks,
            () =>
              showAlertDialog(
                '成功',
                `已成功生成 ${results.length} 个链接并复制到剪贴板！`,
                'success',
              ),
            () =>
              showAlertDialog('提示', '链接生成成功，但复制到剪贴板失败，请手动复制。', 'warning'),
          );
          if (!success) {
            console.error('复制链接失败');
          }
        } catch {
          showAlertDialog('提示', '链接生成成功，但复制到剪贴板失败，请手动复制。', 'warning');
        }
        setSelectedTemplate('');
        await loadCardLinks({ page: 1 });
      }
    } catch {
      setError('生成卡密链接失败，请检查网络连接');
    } finally {
      setIsLoading(false);
    }
  };

  // 生成邮箱卡密链接
  const generateEmailCardLink = async () => {
    if (!selectedTemplate) {
      setError('请选择应用模板');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const templateName = templates.find((t) => t.id === selectedTemplate)?.name;
      if (!templateName) {
        setError('无法获取所选模板的名称');
        setIsLoading(false);
        return;
      }
      console.log('emails:', emails);
      let emailList = [];
      if (loopMode === 'sequence') {
        // 顺序循环：ABCABCABC
        for (let i = 0; i < groupCount; i++) {
          emailList.push(...emails);
        }
      } else if (loopMode === 'group') {
        // 分组循环：AAABBBCCC
        for (let i = 0; i < emails.length; i++) {
          for (let j = 0; j < groupCount; j++) {
            emailList.push(emails[i]);
          }
        }
      }
      console.log('生成邮箱卡密链接，邮箱列表:', emailList);
      const creationPromises = emailList.map((email) =>
        userApi.post('/api/user/cardlinks', {
          appName: templateName,
          phone: email, // 设计字段失误，这里应该用一个更加通用的字段的，这里仍采用phone字段
          templateId: selectedTemplate,
          expiryDays: expiryDays.trim() || undefined,
          tags: selectedTags,
          type,
        }),
      );

      const results = await Promise.all(creationPromises);
      const failedResults = results.filter((result) => !result.success);

      if (failedResults.length > 0) {
        setError(`创建卡链接部分失败: ${failedResults[0].message}`);
      } else {
        const newLinks = results.map((result) => result.data.url).join('\n');
        try {
          const success = await copyToClipboard(
            newLinks,
            () =>
              showAlertDialog(
                '成功',
                `已成功生成 ${results.length} 个链接并复制到剪贴板！`,
                'success',
              ),
            () =>
              showAlertDialog('提示', '链接生成成功，但复制到剪贴板失败，请手动复制。', 'warning'),
          );
          if (!success) {
            console.error('复制链接失败');
          }
        } catch {
          showAlertDialog('提示', '链接生成成功，但复制到剪贴板失败，请手动复制。', 'warning');
        }
        setSelectedTemplate('');
        await loadCardLinks({ page: 1 });
      }
    } catch {
      setError('生成卡密链接失败，请检查网络连接');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 状态筛选处理
   * @param {string} newStatus - 新的状态筛选条件
   */
  const handleStatusFilterChange = (newStatus) => {
    if (statusFilter !== newStatus) {
      setIsLoading(true);
      setError('');
      setStatusFilter(newStatus);
      // 使用新的状态筛选条件重新加载第一页数据，保持其他筛选条件
      loadCardLinks({ page: 1, status: newStatus });
    }
  };

  /**
   * 标签筛选处理
   * @param {string} newTag - 新的标签筛选条件
   */
  const handleTagFilterChange = (newTag) => {
    if (tagFilter !== newTag) {
      setIsLoading(true);
      setError('');
      setTagFilter(newTag);
      // 使用新的标签筛选条件重新加载第一页数据，保持其他筛选条件
      loadCardLinks({ page: 1, tag: newTag });
    }
  };

  /**
   * 模板筛选处理
   * @param {string} newTemplateId - 新的模板筛选条件
   */
  const handleTemplateFilterChange = (newTemplateId) => {
    if (templateFilter !== newTemplateId) {
      setIsLoading(true);
      setError('');
      setTemplateFilter(newTemplateId);
      // 使用新的模板筛选条件重新加载第一页数据，保持其他筛选条件
      loadCardLinks({ page: 1, templateId: newTemplateId });
    }
  };

  /**
   * 刷新卡密链接数据
   */
  const refreshData = () => {
    setError('');
    // 使用当前筛选条件重新加载第一页数据
    loadCardLinks({ page: 1 });
  };

  // 删除卡密
  const deleteCardLinks = async (keys) => {
    if (keys.length === 0) {
      showAlertDialog('提示', '没有可删除的卡密链接', 'warning');
      return;
    }

    const confirmMessage =
      keys.length === 1
        ? '确定要删除这个卡密链接吗？删除后无法恢复。'
        : `确定要删除选中的 ${keys.length} 个卡密链接吗？\n此操作不可恢复！`;

    showConfirmDialog('确认删除', confirmMessage, async () => {
      try {
        setIsLoading(true);
        const data = await userApi.post('/api/user/cardlinks/delete', { keys });
        if (data.success) {
          showAlertDialog('成功', data.message || `成功删除 ${keys.length} 个卡密链接`, 'success');
          // 删除成功后刷新卡密链接列表
          await loadCardLinks({ page: 1 });
        } else {
          setError(data.message || '删除失败');
        }
      } catch {
        setError('删除卡密链接失败，请检查网络连接');
      } finally {
        setIsLoading(false);
      }
    });
  };

  const deleteCardLink = async (key) => {
    await deleteCardLinks([key]);
  };

  // 删除所有未使用
  const deleteAllUnusedLinks = async () => {
    showConfirmDialog(
      '确认删除',
      '确定要删除所有未使用的卡密链接吗？此操作不可恢复！',
      async () => {
        try {
          setIsLoading(true);
          const response = await userApi.post('/api/user/cardlinks/delete-unused', {});
          if (response.success) {
            showAlertDialog(
              '成功',
              `成功删除 ${response.data?.deletedCount || 0} 个未使用卡密链接`,
              'success',
            );
            // 删除成功后刷新卡密链接列表
            await loadCardLinks({ page: 1 });
          } else {
            setError(response.message || '删除未使用卡密链接失败');
          }
        } catch {
          setError('删除未使用卡密链接失败，请检查网络连接');
        } finally {
          setIsLoading(false);
        }
      },
    );
  };

  // 复制全部链接
  const copyLinksToClipboard = async (links) => {
    const linksText = links.map((link) => link.url).join('\n');
    const success = await copyToClipboard(
      linksText,
      () => showAlertDialog('成功', '已成功复制所有链接到剪贴板！', 'success'),
      () => showAlertDialog('错误', '复制链接失败，请手动复制。', 'error'),
    );
    if (!success) {
      console.error('复制链接失败');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', py: 4, px: 2 }}>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Stack spacing={4}>
          {/* 标题栏 */}
          <Paper elevation={3} sx={{ p: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" fontWeight="bold">
                {type === 'sms' ? '手机卡密链接生成' : '邮箱卡密链接生成'}
              </Typography>
              <Button
                href="/user"
                variant="outlined"
                component={Link}
                sx={{ textDecoration: 'none' }}
              >
                返回用户中心
              </Button>
            </Stack>

            {/* 应用模板选择 */}
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel id="template-label">选择应用模板 *</InputLabel>
                <Select
                  labelId="template-label"
                  value={selectedTemplate}
                  label="选择应用模板 *"
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  disabled={templates.length === 0}
                >
                  <MenuItem value="">
                    {templates.length === 0 ? '暂无可用模板' : '请选择应用'}
                  </MenuItem>
                  {templates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name} - {template.description}
                    </MenuItem>
                  ))}
                </Select>
                {templates.length === 0 && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    {error || '暂无应用模版'}
                  </Typography>
                )}
              </FormControl>

              {/* 手机号输入 */}
              {type === 'sms' && (
                <Box>
                  <Typography variant="subtitle2" mb={1}>
                    手机号列表
                  </Typography>
                  <Stack spacing={1}>
                    {phones.map((phone, idx) => (
                      <Stack direction="row" spacing={1} key={idx} alignItems="center">
                        <TextField
                          fullWidth
                          value={phone}
                          onChange={(e) => updatePhone(idx, e.target.value)}
                          placeholder="请输入手机号（11位数字，以1开头）"
                          error={!!phone && !isValidPhone(phone)}
                          helperText={!!phone && !isValidPhone(phone) ? '手机号格式错误' : ' '}
                          size="small"
                        />
                        <IconButton
                          onClick={() => removePhoneInput(idx)}
                          disabled={phones.length <= 1 || isLoading}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    ))}
                  </Stack>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={addPhoneInput}
                    size="small"
                    sx={{ mt: 1 }}
                    disabled={isLoading}
                  >
                    添加手机号
                  </Button>
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    有效手机号数量: {phones.filter((p) => p.trim() && isValidPhone(p)).length}
                  </Typography>
                </Box>
              )}

              {/* 邮箱输入 */}
              {/* 这里与手机号输入基本保持一致，只是输入框的数据限制由手机号改为邮箱，所有字段也保持一致。 */}

              {type === 'email' && (
                <Box>
                  <Typography variant="subtitle2" mb={1}>
                    邮箱列表
                  </Typography>
                  <Stack spacing={1}>
                    {/* 添加一个checkbox，数据源是 emailoptions  */}
                    <FormGroup>
                      {emailOptions.map((option, index) => (
                        <FormControlLabel
                          key={option}
                          control={
                            <Checkbox
                              checked={emails.includes(option)}
                              onChange={() => {
                                const newEmails = emails.includes(option)
                                  ? emails.filter((email) => email !== option)
                                  : [...emails, option];
                                console.log('新邮箱列表:', newEmails);
                                setEmails(newEmails);
                              }}
                            />
                          }
                          label={option}
                        />
                      ))}
                    </FormGroup>
                  </Stack>
                </Box>
              )}

              {/* 循环模式和生成组数（一行布局） */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                {/* 循环模式选择 */}
                <Box>
                  <Typography variant="subtitle2" mb={1}>
                    循环模式
                  </Typography>
                  <FormControl fullWidth size="small">
                    <InputLabel id="loop-mode-label">循环模式</InputLabel>
                    <Select
                      labelId="loop-mode-label"
                      value={loopMode}
                      label="循环模式"
                      onChange={(e) => setLoopMode(e.target.value)}
                    >
                      <MenuItem value="sequence">顺序循环</MenuItem>
                      <MenuItem value="group">分组循环</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    顺序循环：ABCABCABC | 分组循环：AAABBBCCC
                  </Typography>
                </Box>

                {/* 生成组数 */}
                <Box>
                  <Typography variant="subtitle2" mb={1}>
                    生成组数 *
                  </Typography>
                  <TextField
                    type="number"
                    value={groupCountInput}
                    onChange={(e) => setGroupCountInput(e.target.value)}
                    onBlur={() => {
                      const count = parseInt(groupCountInput, 10);
                      if (!isNaN(count) && count > 0) {
                        setGroupCount(count);
                      } else {
                        setGroupCount(1);
                        setGroupCountInput('1');
                      }
                    }}
                    inputProps={{ min: 1 }}
                    fullWidth
                    size="small"
                    disabled={isLoading}
                  />
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    生成组数 × 有效手机号数量 = 实际生成链接数
                  </Typography>
                </Box>
              </Box>

              {/* 其他设置（一行布局） */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                {/* 过期天数设置 */}
                <TextField
                  type="number"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                  placeholder="过期天数"
                  inputProps={{ min: 1 }}
                  size="small"
                  disabled={isLoading}
                  label="过期天数"
                />

                {/* 标签选择 */}
                <FormControl size="small">
                  <InputLabel id="tags-label">选择标签</InputLabel>
                  <Select
                    labelId="tags-label"
                    multiple
                    value={selectedTags}
                    onChange={(e) => setSelectedTags(e.target.value)}
                    label="选择标签"
                    renderValue={(selected) =>
                      selected.length === 0 ? '未选择' : selected.join(', ')
                    }
                  >
                    {userTags.map((tag) => (
                      <MenuItem key={tag} value={tag}>
                        {tag}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* 管理标签按钮 */}
                <Button
                  startIcon={<LabelIcon />}
                  onClick={() => setTagManagerOpen(true)}
                  variant="outlined"
                  size="small"
                  sx={{ height: '40px' }}
                >
                  管理标签
                </Button>
              </Box>

              {userTags.length === 0 && (
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  暂无标签，点击"管理标签"添加
                </Typography>
              )}

              {/* 生成按钮 */}
              <Button
                onClick={type === 'sms' ? generatePhoneCardLink : generateEmailCardLink}
                disabled={isLoading || templates.length === 0}
                variant="contained"
                color="primary"
                fullWidth
                sx={{ py: 1.5 }}
              >
                {isLoading
                  ? '生成中...'
                  : `生成 ${
                      groupCount * phones.filter((p) => p.trim() && isValidPhone(p)).length
                    } 个卡密链接`}
              </Button>

              {error && (
                <Alert severity="error">
                  {error.replace('请至少输入一个有效的手机号码', '请检查输入的手机号格式')}
                </Alert>
              )}
            </Stack>
          </Paper>

          {/* 卡密链接列表 */}
          <Paper elevation={3}>
            <Box p={3} borderBottom={1} borderColor="divider">
              {/* 第一行：标题和搜索 */}
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="h6" fontWeight="bold">
                    已生成的卡密链接
                  </Typography>
                  <Tooltip title="刷新数据">
                    <span>
                      <IconButton onClick={refreshData} disabled={isLoading} color="primary">
                        <RefreshIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>

                {/* 搜索框 */}
                <Box flex={1} maxWidth={300} ml={{ md: 2 }}>
                  <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex' }}>
                    <TextField
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜索链接、卡密或手机号"
                      size="small"
                      fullWidth
                    />
                    {searchQuery && (
                      <Button onClick={clearSearch} color="inherit" sx={{ minWidth: 0 }}>
                        ×
                      </Button>
                    )}
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isSearching}
                      sx={{ ml: 1 }}
                    >
                      {isSearching ? '搜索中...' : '搜索'}
                    </Button>
                  </Box>
                </Box>
              </Stack>

              {/* 第二行：筛选和功能按钮 */}
              <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                {/* 左侧：筛选按钮 */}
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {/* 状态筛选按钮组 */}
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                      状态：
                    </Typography>
                    <Button
                      variant={statusFilter === 'all' ? 'contained' : 'outlined'}
                      onClick={() => handleStatusFilterChange('all')}
                      disabled={isLoading}
                      size="small"
                    >
                      全部
                    </Button>
                    <Button
                      variant={statusFilter === 'unused' ? 'contained' : 'outlined'}
                      onClick={() => handleStatusFilterChange('unused')}
                      disabled={isLoading}
                      size="small"
                    >
                      未使用
                    </Button>
                    <Button
                      variant={statusFilter === 'used' ? 'contained' : 'outlined'}
                      onClick={() => handleStatusFilterChange('used')}
                      disabled={isLoading}
                      size="small"
                    >
                      已使用
                    </Button>
                  </Stack>

                  {/* 标签筛选下拉框 */}
                  {userTags.length > 0 && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                        标签：
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={tagFilter}
                          onChange={(e) => handleTagFilterChange(e.target.value)}
                          displayEmpty
                          disabled={isLoading}
                          sx={{ height: '32px' }}
                        >
                          <MenuItem value="">
                            <em>选择标签</em>
                          </MenuItem>
                          {userTags.map((tag) => (
                            <MenuItem key={tag} value={tag}>
                              {tag}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>
                  )}

                  {/* 模板筛选下拉框 */}
                  {templates.length > 0 && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                        模板：
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 150 }}>
                        <Select
                          value={templateFilter}
                          onChange={(e) => handleTemplateFilterChange(e.target.value)}
                          displayEmpty
                          disabled={isLoading}
                          sx={{ height: '32px' }}
                        >
                          <MenuItem value="">
                            <em>选择模板</em>
                          </MenuItem>
                          {templates.map((template) => (
                            <MenuItem key={template.id} value={template.id}>
                              {template.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>
                  )}
                </Stack>

                {/* 右侧：功能按钮 */}
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={deleteAllUnusedLinks}
                    disabled={isLoading}
                    size="small"
                  >
                    批量删除未使用
                  </Button>
                </Stack>
              </Stack>

              {/* 搜索结果统计 */}
              {(searchQuery || tagFilter || templateFilter) && (
                <Box mt={1} p={1} bgcolor="action.hover" borderRadius={1}>
                  <Typography variant="caption" color="text.secondary">
                    {searchQuery && (
                      <span>
                        🔍 搜索关键词：<strong>"{searchQuery}"</strong>
                      </span>
                    )}
                    {searchQuery && (tagFilter || templateFilter) && <span> | </span>}
                    {tagFilter && (
                      <span>
                        🏷️ 标签筛选：<strong>{tagFilter}</strong>
                      </span>
                    )}
                    {tagFilter && templateFilter && <span> | </span>}
                    {templateFilter && (
                      <span>
                        📱 模板筛选：
                        <strong>
                          {templates.find((t) => t.id === templateFilter)?.name || templateFilter}
                        </strong>
                      </span>
                    )}
                    <span style={{ marginLeft: '8px' }}>
                      共找到 <strong>{filteredCardLinks.length}</strong> 个结果
                    </span>
                  </Typography>
                </Box>
              )}
            </Box>

            <Divider />

            {/* 卡密链接列表内容 */}
            {filteredCardLinks.length > 0 ? (
              filteredCardLinks.map((cardLink) => (
                <Box
                  key={cardLink.cardKey}
                  p={2}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      应用：{cardLink.appName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      卡密：{cardLink.cardKey}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      手机号：{cardLink.phone || '无手机号'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      创建时间：{new Date(Number(cardLink.createdAt)).toLocaleString()}
                    </Typography>
                    {cardLink.expiryDays && (
                      <Typography variant="body2" color="warning.main">
                        过期天数：{cardLink.expiryDays} 天
                      </Typography>
                    )}
                    {cardLink.tags && cardLink.tags.length > 0 && (
                      <Box mt={1}>
                        <Typography variant="body2" color="text.secondary" mb={0.5}>
                          标签：
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {cardLink.tags.map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                    {statusFilter !== 'unused' && cardLink.firstUsedAt && (
                      <Typography variant="body2" color="success.main">
                        首次使用：{new Date(Number(cardLink.firstUsedAt)).toLocaleString()}
                      </Typography>
                    )}
                    <Box mt={1}>
                      <Link
                        href={cardLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: 'primary.main',
                          wordBreak: 'break-all',
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {cardLink.url}
                      </Link>
                    </Box>
                  </Box>
                  <Stack spacing={1} alignItems="flex-end">
                    <Tooltip title="复制链接">
                      <IconButton
                        onClick={async () => {
                          await copyToClipboard(
                            cardLink.url,
                            () => showAlertDialog('成功', '链接已复制到剪贴板！', 'success'),
                            () => showAlertDialog('错误', '复制失败，请手动复制', 'error'),
                          );
                        }}
                        color="primary"
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>
                    {!cardLink.firstUsedAt && (
                      <Tooltip title="删除">
                        <span>
                          <IconButton
                            onClick={() => deleteCardLink(cardLink.cardKey)}
                            color="error"
                            disabled={isLoading}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Stack>
                </Box>
              ))
            ) : (
              <Box p={3} textAlign="center">
                <Typography color="text.secondary">
                  {isLoading
                    ? '加载中...'
                    : cardLinks.length === 0
                    ? '暂无卡密链接'
                    : searchQuery
                    ? `没有找到包含 "${searchQuery}" 的卡密链接`
                    : '没有符合条件的卡密链接'}
                </Typography>
              </Box>
            )}

            {/* 分页控件 */}
            {pagination.totalPages > 1 && (
              <Box p={2} display="flex" justifyContent="center">
                <Pagination
                  count={pagination.totalPages}
                  page={pagination.page}
                  onChange={(_, value) => changePage(value)}
                  color="primary"
                  showFirstButton
                  showLastButton
                  disabled={isLoadingMore}
                />
              </Box>
            )}

            {/* 加载状态 */}
            {isLoadingMore && (
              <Box p={2} textAlign="center">
                <CircularProgress size={28} />
                <Typography ml={2} display="inline">
                  加载中...
                </Typography>
              </Box>
            )}
          </Paper>

          {/* 全局加载指示器 */}
          {isLoading && (
            <Box
              position="fixed"
              top={0}
              left={0}
              width="100vw"
              height="100vh"
              display="flex"
              alignItems="center"
              justifyContent="center"
              zIndex={1300}
              bgcolor="rgba(255,255,255,0.5)"
            >
              <CircularProgress size={48} color="primary" />
              <Typography ml={2} color="primary" fontWeight="medium">
                加载中...
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>

      {/* 确认对话框 */}
      <Dialog
        open={confirmDialog.open}
        onClose={closeConfirmDialog}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description" sx={{ whiteSpace: 'pre-line' }}>
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDialog} color="inherit">
            取消
          </Button>
          <Button onClick={handleConfirm} color="primary" variant="contained">
            确认
          </Button>
        </DialogActions>
      </Dialog>

      {/* 提示对话框 */}
      <Dialog
        open={alertDialog.open}
        onClose={closeAlertDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{alertDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description" sx={{ whiteSpace: 'pre-line' }}>
            {alertDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAlertDialog} color="primary" variant="contained">
            确定
          </Button>
        </DialogActions>
      </Dialog>

      {/* 标签管理弹窗 */}
      <TagManagerDialog
        open={tagManagerOpen}
        onClose={() => setTagManagerOpen(false)}
        onTagsChange={handleTagsChange}
      />
    </Box>
  );
}
