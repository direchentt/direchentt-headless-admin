import { NextRequest, NextResponse } from 'next/server';
import { getStoreData } from '../../../lib/backend';

export async function GET(req: NextRequest) {
    const shopId = req.nextUrl.searchParams.get('shop') || '5112334';

    try {
        console.log(`🔍 Testing MongoDB connection for shop ${shopId}...`);
        const storeData = await getStoreData(shopId);

        if (!storeData) {
            return NextResponse.json({
                success: false,
                error: 'Store not found in MongoDB',
                shopId,
                hint: 'Check if the store exists in AppRegaloDB.stores collection'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            storeData: {
                storeId: storeData.storeId,
                hasAccessToken: !!storeData.accessToken,
                accessTokenLength: storeData.accessToken?.length || 0,
                domain: storeData.domain,
                name: storeData.name || storeData.shop_name
            }
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
