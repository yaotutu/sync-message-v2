import { Card, CardContent, Box, Divider } from '@mui/material';
import PhoneSection from './PhoneSection';
import CodeSection from './CodeSection';

/**
 * 消息内容主组件
 */
export default function MessageContent({
    phone,
    displayContent,
    verificationCode,
    copyStatus,
    onCopy,
    codeLoading,
    isMobile
}) {
    return (
        <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 2.5 } }}>
                    {/* 手机号部分 */}
                    <PhoneSection
                        phone={phone}
                        copyStatus={copyStatus}
                        onCopy={onCopy}
                        isMobile={isMobile}
                    />

                    <Divider sx={{ my: { xs: 0.5, sm: 1 } }} />

                    {/* 验证码部分 */}
                    <CodeSection
                        displayContent={displayContent}
                        verificationCode={verificationCode}
                        copyStatus={copyStatus}
                        onCopy={onCopy}
                        codeLoading={codeLoading}
                        isMobile={isMobile}
                    />
                </Box>
            </CardContent>
        </Card>
    );
} 