/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	pinpointProjectId
Amplify Params - DO NOT EDIT */

import {PinpointAPI} from "pinpoint-api"
import {parseDateTime} from "pinpoint-api/utils"
import {APIGatewayProxyEvent} from "aws-lambda";
import {Settings} from "luxon";

Settings.defaultZone = 'Japan';
Settings.defaultLocale = 'ja-JP';

export const handler = async (event: APIGatewayProxyEvent) => {
    console.log('Received event:', event);
    const api = new PinpointAPI(process.env.REGION!, process.env.pinpointProjectId!);
    const params = event.queryStringParameters!;
    const numberValidateResponse = await api.validateNumber(params.phoneNumber!);
    if (numberValidateResponse.PhoneTypeCode === 0) {
        const dateTime = parseDateTime(params.dateTime!);
        const metadata = api.createSegmentMetadata(params.itemName!, dateTime);
        const endpointId = await api.createEndpoint(numberValidateResponse, params.name!, params.itemName!, metadata.uid, dateTime);
        await api.sendConfirmation(endpointId, params.templateName!);
        await api.createCampaigns(metadata.uid, metadata.name, dateTime);
    } else {
        console.log("Received a phone number that isn't capable of receiving " +
            "SMS messages. No endpoint created.");
    }
};
