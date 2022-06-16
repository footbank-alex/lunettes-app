/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	pinpointProjectId
Amplify Params - DO NOT EDIT */

import {PinpointAPI} from "pinpoint-api"
import {APIGatewayProxyEvent} from "aws-lambda";
import {Settings} from "luxon";

Settings.defaultZone = 'Japan';
Settings.defaultLocale = 'ja-JP';

export const handler = async (event: APIGatewayProxyEvent) => {
    console.log('Received event:', event);
    try {
        await migrateEndpoints();
    } catch (e) {
        console.error(e);
    }
};

async function migrateEndpoints() {
    const api = new PinpointAPI(process.env.REGION!, process.env.pinpointProjectId!);
    const deletedSegments = new Set();
    for await (const campaign of api.getCampaigns()) {
        if (!deletedSegments.has(campaign.SegmentId)) {
            await api.deleteSegment(campaign.SegmentId!);
            deletedSegments.add(campaign.SegmentId);
        }
        await api.deleteCampaign(campaign.Id!);
    }

    const endpoints = await api.exportEndpoints();
    await api.migrateEndpoints(endpoints);
    await api.deleteOldEndpoints(endpoints);
}