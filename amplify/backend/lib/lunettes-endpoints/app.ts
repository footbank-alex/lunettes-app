/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/

import bodyParser from "body-parser";
import express from "express";
import * as awsServerlessExpressMiddleware from 'aws-serverless-express/middleware';
import {PinpointAPI} from "pinpoint-api";
import {DateTime} from "luxon";
import {parseDateTime} from "pinpoint-api/utils";


/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	pinpointProjectId
Amplify Params - DO NOT EDIT */

// declare a new express app
const app = express();
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

// Enable CORS for all methods
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
});

function parse(dateTime: string) {
    let result = DateTime.fromISO(dateTime);
    if (result.isValid) {
        return result;
    }
    result = DateTime.fromFormat(dateTime, "yyyy年M月d日 H:mm");
    if (result.isValid) {
        return result;
    }
    try {
        return parseDateTime(dateTime);
    } catch (e) {
        console.warn(e);
    }
    return null;
}

function getErrorMessage(e: unknown) {
    let errorMessage = 'Unexpected error';
    if (e instanceof Error) {
        errorMessage = e.message
    } else if (typeof e === 'string') {
        errorMessage = e;
    }
    return errorMessage;
}

app.get('/endpoints/:phoneNumber', async (req, res) => {
    const api = new PinpointAPI(process.env.REGION, process.env.pinpointProjectId);
    try {
        const numberValidateResponse = await api.validateNumber(req.params.phoneNumber);
        if (numberValidateResponse.PhoneTypeCode === 0) {
            const endpoints = await api.getEndpoints(numberValidateResponse);
            const response = endpoints
                .filter((endpoint) => endpoint.Attributes?.ItemName && endpoint.Attributes?.DateTime)
                .map((endpoint) => {
                    return {
                        id: endpoint.Id,
                        itemName: endpoint.Attributes.ItemName[0],
                        dateTime: parse(endpoint.Attributes.DateTime[0])
                    }
                })
                .filter((result) => result.dateTime && result.dateTime > DateTime.local());
            res.json(response);
        } else {
            const message = "Invalid phone number";
            console.error(message);
            res.status(400).json({error: message, url: req.url});
        }
    } catch (e) {
        console.error(e);
        let errorMessage = getErrorMessage(e);
        res.status(500).json({error: errorMessage, url: req.url});
    }
});

app.put('/endpoint/:endpointId', async (req, res) => {
    let {dateTime} = req.body;
    if (!dateTime) {
        const message = "Invalid request, missing dateTime parameter";
        console.error(message);
        return res.status(400).json({error: message, url: req.url});
    }
    dateTime = DateTime.fromISO(dateTime);
    if (!dateTime.isValid) {
        const message = "Invalid dateTime parameter";
        console.error(message);
        return res.status(400).json({error: message, url: req.url});
    }
    if (dateTime <= DateTime.local()) {
        const message = "DateTime cannot be in the past";
        console.error(message);
        return res.status(400).json({error: message, url: req.url});
    }
    try {
        const api = new PinpointAPI(process.env.REGION, process.env.pinpointProjectId);
        await api.updateEndpoint(req.params.endpointId, dateTime);
        res.json({success: 'Successfully updated endpoint!', url: req.url, body: req.body});
    } catch (e: unknown) {
        let errorMessage = getErrorMessage(e);
        res.status(500).json({error: errorMessage, url: req.url});
    }
});

app.delete('/endpoint/:endpointId', async (req, res) => {
    try {
        const api = new PinpointAPI(process.env.REGION, process.env.pinpointProjectId);
        await api.deleteEndpoint(req.params.endpointId);
        res.json({success: 'Successfully deleted endpoint!', url: req.url});
    } catch (e: unknown) {
        let errorMessage = getErrorMessage(e);
        res.status(500).json({error: errorMessage, url: req.url});
    }
});

app.listen(3000, () => {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
export default app
