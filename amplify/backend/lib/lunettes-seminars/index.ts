import * as awsServerlessExpress from 'aws-serverless-express';
import app from './app';
import {Settings} from "luxon";
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

Settings.defaultZone = 'Japan';
Settings.defaultLocale = 'ja-JP';

/**
 * @type {import('http').Server}
 */
const server = awsServerlessExpress.createServer(app);

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
export const handler = async (event: APIGatewayProxyEvent, context: Context) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    return awsServerlessExpress.proxy(server, event, context, 'PROMISE').promise;
};
