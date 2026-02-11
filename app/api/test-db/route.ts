import dbConnect from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await dbConnect();
        return NextResponse.json({ status: 'Connected' });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ status: 'Error', error: (e as Error).message }, { status: 500 });
    }
}
