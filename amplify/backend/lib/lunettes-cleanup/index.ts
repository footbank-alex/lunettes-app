/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	pinpointProjectId
Amplify Params - DO NOT EDIT */

import {PinpointAPI} from "pinpoint-api"
import {APIGatewayProxyEvent} from "aws-lambda";
import {DateTime, Settings} from "luxon";
import {CampaignStatus, Frequency} from "@aws-sdk/client-pinpoint";

Settings.defaultZone = 'Japan';
Settings.defaultLocale = 'ja-JP';

const DELETION_INTERVAL = {months: 1};

export const handler = async (event: APIGatewayProxyEvent) => {
    console.log('Received event:', event);
    try {
        await deleteCompletedCampaigns();
    } catch (e) {
        console.error(e);
    }
};

async function deleteCompletedCampaigns() {
    const deletionThreshold = DateTime.local().minus(DELETION_INTERVAL);
    const api = new PinpointAPI(process.env.REGION!, process.env.pinpointProjectId!);
    const deletedSegments = new Set();
    for await (const campaign of api.getCampaigns(value =>
        [CampaignStatus.DELETED.toString(), CampaignStatus.COMPLETED.toString()]
            .includes(value.State?.CampaignStatus?.toString() ?? CampaignStatus.INVALID)
        && value.Schedule?.Frequency === Frequency.ONCE
        && (!value.Schedule?.StartTime || DateTime.fromISO(value.Schedule.StartTime) < deletionThreshold)
    )) {
        if (!deletedSegments.has(campaign.SegmentId)) {
            try {
                await api.deleteSegment(campaign.SegmentId!);
                deletedSegments.add(campaign.SegmentId);
            } catch (e) {
                console.error(e);
            }
        }
        try {
            await api.deleteCampaign(campaign.Id!);
            console.log('Deleted campaign:', campaign.Name);
        } catch (e) {
            console.error(e);
        }
    }
}