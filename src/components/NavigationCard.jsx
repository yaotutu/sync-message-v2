import Link from 'next/link';
import { useState, useEffect } from 'react';

/**
 * NavigationCard 组件使用示例：
 * 
 * // 使用指定颜色主题
 * <NavigationCard
 *   href="/user/cardlinks"
 *   title="卡密链接管理"
 *   description="创建和管理带有链接的卡密"
 *   colorTheme="blue"
 * />
 * 
 * // 使用随机颜色
 * <NavigationCard
 *   href="/user/messages"
 *   title="我的消息"
 *   description="查看和管理所有收到的短信消息"
 *   randomColor={true}
 * />
 * 
 * // 添加自定义样式
 * <NavigationCard
 *   href="/template"
 *   title="应用模版"
 *   description="查看和管理应用模版"
 *   colorTheme="purple"
 *   className="custom-class"
 * />
 * 
 * 支持的颜色主题：'blue', 'green', 'purple', 'orange', 'pink', 'indigo', 'teal', 'yellow'
 */

// 预定义的颜色主题
const colorThemes = [
    {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-300'
    },
    {
        bg: 'bg-green-50 dark:bg-green-900/20',
        hover: 'hover:bg-green-100 dark:hover:bg-green-900/30',
        text: 'text-green-700 dark:text-green-300'
    },
    {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/30',
        text: 'text-purple-700 dark:text-purple-300'
    },
    {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        hover: 'hover:bg-orange-100 dark:hover:bg-orange-900/30',
        text: 'text-orange-700 dark:text-orange-300'
    },
    {
        bg: 'bg-pink-50 dark:bg-pink-900/20',
        hover: 'hover:bg-pink-100 dark:hover:bg-pink-900/30',
        text: 'text-pink-700 dark:text-pink-300'
    },
    {
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        hover: 'hover:bg-indigo-100 dark:hover:bg-indigo-900/30',
        text: 'text-indigo-700 dark:text-indigo-300'
    },
    {
        bg: 'bg-teal-50 dark:bg-teal-900/20',
        hover: 'hover:bg-teal-100 dark:hover:bg-teal-900/30',
        text: 'text-teal-700 dark:text-teal-300'
    },
    {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        hover: 'hover:bg-yellow-100 dark:hover:bg-yellow-900/30',
        text: 'text-yellow-700 dark:text-yellow-300'
    }
];

/**
 * 导航卡片组件
 * @param {Object} props
 * @param {string} props.href - 链接地址
 * @param {string} props.title - 卡片标题
 * @param {string} props.description - 卡片描述
 * @param {string} props.colorTheme - 自定义颜色主题 ('blue', 'green', 'purple', 'orange', 'pink', 'indigo', 'teal', 'yellow')
 * @param {boolean} props.randomColor - 是否使用随机颜色
 * @param {string} props.className - 额外的CSS类名
 */
export default function NavigationCard({
    href,
    title,
    description,
    colorTheme,
    randomColor = false,
    className = ''
}) {
    const [selectedTheme, setSelectedTheme] = useState(null);

    useEffect(() => {
        if (randomColor) {
            // 随机选择一个颜色主题
            const randomIndex = Math.floor(Math.random() * colorThemes.length);
            setSelectedTheme(colorThemes[randomIndex]);
        } else if (colorTheme) {
            // 根据传入的颜色主题名称选择
            const themeMap = {
                blue: colorThemes[0],
                green: colorThemes[1],
                purple: colorThemes[2],
                orange: colorThemes[3],
                pink: colorThemes[4],
                indigo: colorThemes[5],
                teal: colorThemes[6],
                yellow: colorThemes[7]
            };
            setSelectedTheme(themeMap[colorTheme] || colorThemes[0]);
        } else {
            // 默认使用蓝色主题
            setSelectedTheme(colorThemes[0]);
        }
    }, [colorTheme, randomColor]);

    if (!selectedTheme) {
        return null;
    }

    return (
        <Link
            href={href}
            className={`block p-4 ${selectedTheme.bg} ${selectedTheme.hover} transition-all ${className}`}
        >
            <h4 className={`text-lg font-medium ${selectedTheme.text} mb-2`}>
                {title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
                {description}
            </p>
        </Link>
    );
} 