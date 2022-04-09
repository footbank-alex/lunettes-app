import * as awsServerlessExpress from 'aws-serverless-express';
import app from './app';
import {Settings} from "luxon";

Settings.defaultZone = 'Japan';
Settings.defaultLocale = 'ja-JP';

/**
 * @type {import('http').Server}
 */
const server = awsServerlessExpress.createServer(app);

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
export const handler = async (event, context) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    return awsServerlessExpress.proxy(server, event, context, 'PROMISE').promise;
};
