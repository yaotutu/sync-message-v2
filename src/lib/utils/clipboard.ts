/**
 * 通用的复制到剪贴板函数
 * @param text 要复制的文本
 * @param onSuccess 复制成功的回调
 * @param onError 复制失败的回调
 */
export async function copyToClipboard(
    text: string,
    onSuccess?: () => void,
    onError?: () => void
): Promise<boolean> {
    // 保存当前选中的文本
    const selectedText = window.getSelection()?.toString();
    let copySuccess = false;

    try {
        // 方法1: 使用 navigator.clipboard (最新标准)
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                copySuccess = true;
            } catch {
                // 如果clipboard API失败，回退到其他方法
                copySuccess = await fallbackCopyToClipboard();
            }
        } else {
            // 回退方法
            copySuccess = await fallbackCopyToClipboard();
        }

        // 处理结果
        if (copySuccess) {
            onSuccess?.();
        } else {
            onError?.();
        }

        return copySuccess;
    } catch (err) {
        console.error('复制失败:', err);
        onError?.();
        return false;
    }

    // 内部函数：回退复制方法
    async function fallbackCopyToClipboard(): Promise<boolean> {
        try {
            // 方法2: 创建可选择的span元素（对于移动设备更友好）
            const span = document.createElement('span');
            span.textContent = text;
            span.style.whiteSpace = 'pre'; // 保留空格
            span.style.webkitUserSelect = 'auto'; // 对Safari友好
            span.style.userSelect = 'all'; // 现代浏览器

            // 将span添加到页面
            document.body.appendChild(span);

            // 方法3: 创建Range和Selection
            if (window.getSelection && document.createRange) {
                // 清除当前选择
                window.getSelection()?.removeAllRanges();

                const range = document.createRange();
                range.selectNodeContents(span);

                const selection = window.getSelection();
                selection?.addRange(range);

                try {
                    // 方法4: 尝试execCommand
                    copySuccess = document.execCommand('copy');
                    if (!copySuccess) {
                        // 如果execCommand失败，提示用户手动复制
                        span.style.position = 'fixed';
                        span.style.top = '50%';
                        span.style.left = '50%';
                        span.style.transform = 'translate(-50%, -50%)';
                        span.style.backgroundColor = 'white';
                        span.style.padding = '20px';
                        span.style.border = '1px solid black';
                        span.style.zIndex = '9999';

                        // 3秒后移除提示
                        setTimeout(() => {
                            if (document.body.contains(span)) {
                                document.body.removeChild(span);
                            }
                        }, 3000);
                    }
                } catch (e) {
                    copySuccess = false;
                }
            }

            // 清理：移除span元素
            if (document.body.contains(span)) {
                document.body.removeChild(span);
            }

            // 恢复之前的选择
            if (selectedText) {
                const selection = window.getSelection();
                selection?.removeAllRanges();
                const range = document.createRange();
                const textNode = document.createTextNode(selectedText);
                range.selectNodeContents(textNode);
                selection?.addRange(range);
            }

            return copySuccess;
        } catch (err) {
            console.error('回退复制方法失败:', err);
            return false;
        }
    }
} 