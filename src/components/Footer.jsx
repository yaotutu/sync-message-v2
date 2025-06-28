'use client';

import { Box, Typography } from '@mui/material';

export default function Footer() {
    // 从环境变量中读取联系信息
    const contactInfo = {
        email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || '',
        wechat: process.env.NEXT_PUBLIC_CONTACT_WECHAT || '',
        qq: process.env.NEXT_PUBLIC_CONTACT_QQ || '',
        phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || '',
        website: process.env.NEXT_PUBLIC_CONTACT_WEBSITE || '',
        copyright: process.env.NEXT_PUBLIC_CONTACT_COPYRIGHT || ''
    };

    // 检查是否应该显示Footer
    const shouldShowFooter = () => {
        // 如果NEXT_PUBLIC_HIDE_FOOTER为true，则隐藏Footer
        return process.env.NEXT_PUBLIC_HIDE_FOOTER !== 'true';
    };

    // 构建联系信息文本
    const buildContactText = () => {
        const parts = [];

        if (contactInfo.email && contactInfo.email.trim()) {
            parts.push(`邮箱：${contactInfo.email}`);
        }

        if (contactInfo.wechat && contactInfo.wechat.trim()) {
            parts.push(`自助系统购买/代理申请👉V：${contactInfo.wechat}`);
        }

        if (contactInfo.qq && contactInfo.qq.trim()) {
            parts.push(`QQ：${contactInfo.qq}`);
        }

        if (contactInfo.phone && contactInfo.phone.trim()) {
            parts.push(`电话：${contactInfo.phone}`);
        }

        if (contactInfo.website && contactInfo.website.trim()) {
            parts.push(`网站：${contactInfo.website}`);
        }

        if (contactInfo.copyright && contactInfo.copyright.trim()) {
            parts.push(`版权所有：${contactInfo.copyright}`);
        }

        // 如果没有配置任何联系信息，显示默认文本
        if (parts.length === 0) {
            return '联系我们：support@example.com | 微信：sync-message | QQ：123456789';
        }

        return parts.join(' | ');
    };

    // 如果不需要显示Footer，返回null
    if (!shouldShowFooter()) {
        return null;
    }

    return (
        <Box
            component="footer"
            sx={{
                height: '70px',
                backgroundColor: 'grey.100',
                borderTop: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                px: 2,
                py: 1
            }}
        >
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                    textAlign: 'center',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    lineHeight: 1.5
                }}
            >
                {buildContactText()}
            </Typography>
        </Box>
    );
} 