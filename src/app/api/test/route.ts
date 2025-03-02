import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    console.log('收到测试请求');

    return new NextResponse(
        JSON.stringify({
            success: true,
            message: '测试API正常工作',
            timestamp: new Date().toISOString()
        }),
        {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }
    );
} 