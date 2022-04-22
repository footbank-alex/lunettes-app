import {
    CampaignResponse,
    CreateCampaignCommand,
    CreateSegmentCommand,
    DeleteCampaignCommand,
    DeleteEndpointCommand,
    DeleteSegmentCommand,
    GetCampaignsCommand,
    GetSegmentsCommand,
    GetSegmentsCommandOutput,
    GetUserEndpointsCommand,
    NotFoundException,
    NumberValidateResponse,
    PhoneNumberValidateCommand,
    PinpointClient,
    SendMessagesCommand,
    UpdateEndpointCommand
} from "@aws-sdk/client-pinpoint";
import {createHash, zenkaku2hankaku} from "./utils";
import {DateTime} from "luxon";
import {CampaignConfig} from "./campaign_config";

const MESSAGE_TYPE = "TRANSACTIONAL";

const PAGE_SIZE = 200;

const SEGMENT_UID_TAG = 'uid';

const CAMPAIGN_NAME_MAX_LENGTH = 64;
const CAMPAIGN_CONFIGS = [
    new CampaignConfig('lunettes_seminar_reminder_1day', '（1日前）', (dateTime) => dateTime.minus({days: 1})),
    new CampaignConfig('lunettes_seminar_reminder_1hour', '（1時間前）', (dateTime) => dateTime.minus({hours: 1}))
];

export class PinpointAPI {
    private readonly pinpoint: PinpointClient;
    private readonly projectId: string;

    constructor(region: string, projectId: string) {
        this.pinpoint = new PinpointClient({region: region});
        this.projectId = projectId;
    }

    createSegmentMetadata(itemName: string, dateTime: DateTime): { uid: string; name: string } {
        let dateSuffix = '_' + dateTime.toISO(
            {
                format: 'basic',
                suppressMilliseconds: true,
                suppressSeconds: true,
                includeOffset: false
            });
        // since campaign names have a limit of 64 characters and segment name will be used in the campaign name
        // we have to calculate max length for the segment name prefix
        const segmentName = itemName.substring(0,
            CAMPAIGN_NAME_MAX_LENGTH - dateSuffix.length - Math.max(
                ...CAMPAIGN_CONFIGS.map(config => config.nameSuffix.length))) + dateSuffix;
        const segmentUid = createHash(itemName + dateSuffix);
        return {
            uid: segmentUid,
            name: segmentName
        };
    }

    async validateNumber(phoneNumber: string) {
        let destinationNumber = zenkaku2hankaku(phoneNumber.replace(/[-\/ー／]/g, ''));
        if (destinationNumber.length === 11) {
            destinationNumber = "+81" + destinationNumber;
        }
        const params = {
            NumberValidateRequest: {
                IsoCountryCode: 'JA',
                PhoneNumber: destinationNumber
            }
        };
        const data = await this.pinpoint.send(new PhoneNumberValidateCommand(params));
        console.debug(data);
        return data.NumberValidateResponse;
    }

    async getEndpoints(numberValidateResponse: NumberValidateResponse) {
        const userId = PinpointAPI.getUserId(numberValidateResponse.CleansedPhoneNumberE164);
        try {
            const response = await this.pinpoint.send(new GetUserEndpointsCommand({
                ApplicationId: this.projectId,
                UserId: userId
            }));
            console.debug(response);
            return response.EndpointsResponse.Item || [];
        } catch (e: unknown) {
            console.error(e);
            if (e instanceof NotFoundException) {
                console.info(`User ID ${userId} does not exist, returning empty list of endpoints`);
                return [];
            }
            throw e;
        }
    }

    async createEndpoint(numberValidateResponse: NumberValidateResponse, name: string, itemName: string, source: string, dateTime: DateTime) {
        const destinationNumber = numberValidateResponse.CleansedPhoneNumberE164;
        const userId = PinpointAPI.getUserId(destinationNumber);
        const endpointId = PinpointAPI.getEndpointId(userId, source);

        const params = {
            ApplicationId: this.projectId,
            EndpointId: endpointId,
            EndpointRequest: {
                ChannelType: 'SMS',
                Address: destinationNumber,
                OptOut: 'NONE',
                Location: {
                    PostalCode: numberValidateResponse.ZipCode,
                    City: numberValidateResponse.City,
                    Country: numberValidateResponse.CountryCodeIso2,
                },
                Demographic: {
                    Timezone: numberValidateResponse.Timezone
                },
                Attributes: {
                    Source: [
                        source
                    ],
                    ItemName: [
                        itemName
                    ],
                    DateTime: [
                        PinpointAPI.getEndpointDateTime(dateTime)
                    ]
                },
                User: {
                    UserAttributes: {
                        Name: [
                            name
                        ]
                    },
                    UserId: userId
                }
            }
        };
        const response = await this.pinpoint.send(new UpdateEndpointCommand(params));
        console.debug(response);
        return endpointId;
    }

    async updateEndpoint(endpointId: string, dateTime: DateTime) {
        const endpoint = await this.deleteEndpoint(endpointId);
        const metadata = this.createSegmentMetadata(endpoint.Attributes.ItemName[0], dateTime);

        const params = {
            ApplicationId: this.projectId,
            EndpointId: PinpointAPI.getEndpointId(endpoint.User.UserId, metadata.uid),
            EndpointRequest: {
                ...endpoint,
                Attributes: {
                    ...endpoint.Attributes,
                    Source: [
                        metadata.uid
                    ],
                    DateTime: [
                        PinpointAPI.getEndpointDateTime(dateTime)
                    ]
                }
            }
        };
        const response = await this.pinpoint.send(new UpdateEndpointCommand(params));
        console.debug(response);
        await this.createCampaigns(metadata.uid, metadata.name, dateTime);
    }

    async deleteEndpoint(endpointId: string) {
        const response = await this.pinpoint.send(new DeleteEndpointCommand({
            ApplicationId: this.projectId,
            EndpointId: endpointId
        }));
        console.debug(response);
        return response.EndpointResponse;
    }

    async sendConfirmation(endpointId: string, templateName: string) {
        const params = {
            ApplicationId: this.projectId,
            MessageRequest: {
                Endpoints: {
                    [endpointId]: {}
                },
                MessageConfiguration: {
                    SMSMessage: {
                        MessageType: MESSAGE_TYPE
                    }
                },
                TemplateConfiguration: {
                    SMSTemplate: {
                        Name: templateName
                    }
                }
            }
        };

        const data = await this.pinpoint.send(new SendMessagesCommand(params));
        console.debug("Message sent! " +
            data.MessageResponse.EndpointResult[endpointId].StatusMessage);
        return data.MessageResponse;
    }

    async segmentExists(uid: string) {
        let token = undefined;
        do {
            const data: GetSegmentsCommandOutput = await this.pinpoint.send(new GetSegmentsCommand({
                ApplicationId: this.projectId,
                PageSize: PAGE_SIZE.toString(),
                Token: token
            }));
            if (data.SegmentsResponse.Item.some(value => value.tags && value.tags[SEGMENT_UID_TAG] === uid)) {
                return true;
            }
            token = data.SegmentsResponse.NextToken;
        } while (token);
        return false;
    }

    async createSegment(segmentUid: string, segmentName: string) {
        const params = {
            ApplicationId: this.projectId,
            WriteSegmentRequest: {
                Dimensions: {
                    Attributes: {
                        Source: {
                            Values: [
                                segmentUid
                            ],
                            AttributeType: 'INCLUSIVE'
                        }
                    }
                },
                Name: segmentName,
                tags: {
                    [SEGMENT_UID_TAG]: segmentUid
                }
            }
        };
        const data = await this.pinpoint.send(new CreateSegmentCommand(params));
        console.log('Segment created');
        console.debug(data);
        return data.SegmentResponse.Id;
    }

    async createCampaigns(segmentUid: string, segmentName: string, dateTime: DateTime) {
        if (CAMPAIGN_CONFIGS.some(config => config.isApplicable(dateTime)) && !await this.segmentExists(segmentUid)) {
            const segmentId = await this.createSegment(segmentUid, segmentName);
            await Promise.all(CAMPAIGN_CONFIGS.filter(config => config.isApplicable(dateTime)).map(
                async config => this.createCampaign(segmentName + config.nameSuffix, segmentId, config.template,
                    config.calculateDateTime(dateTime))));
        }
    }

    async createCampaign(campaignName: string, segmentId: string, templateName: string, dateTime: DateTime) {
        const params = {
            ApplicationId: this.projectId,
            WriteCampaignRequest: {
                MessageConfiguration: {
                    SMSMessage: {
                        MessageType: MESSAGE_TYPE
                    }
                },
                Name: campaignName,
                Schedule: {
                    StartTime: dateTime.toISO(),
                    Frequency: 'ONCE',
                    Timezone: 'UTC+09'
                },
                SegmentId: segmentId,
                TemplateConfiguration: {
                    SMSTemplate: {
                        Name: templateName
                    }
                }
            }
        };
        const data = await this.pinpoint.send(new CreateCampaignCommand(params));
        console.log('Campaign created');
        console.debug(data);
        return data.CampaignResponse.Id;
    }

    async* getCampaigns(filter: (value: CampaignResponse) => boolean = () => true, pageSize = PAGE_SIZE): AsyncIterableIterator<CampaignResponse> {
        let token = undefined;
        do {
            const params = {
                ApplicationId: this.projectId,
                PageSize: pageSize.toString(),
                Token: token
            };
            const data = await this.pinpoint.send(new GetCampaignsCommand(params));
            for (const item of data.CampaignsResponse.Item.filter(filter)) {
                yield item;
            }
            token = data.CampaignsResponse.NextToken;
        } while (token);
    }

    async deleteSegment(segmentId: string) {
        await this.pinpoint.send(
            new DeleteSegmentCommand({ApplicationId: this.projectId, SegmentId: segmentId}));
        console.log('Deleted segment:', segmentId);
    }

    async deleteCampaign(campaignId: string) {
        await this.pinpoint.send(new DeleteCampaignCommand({ApplicationId: this.projectId, CampaignId: campaignId}));
        console.log('Deleted campaign:', campaignId);
    }

    private static getUserId(cleansedPhoneNumber: string) {
        return cleansedPhoneNumber.substring(1);
    }

    private static getEndpointId(userId: string, source: string) {
        return userId + '_' + source;
    }

    private static getEndpointDateTime(dateTime: DateTime) {
        return dateTime.toISO({suppressMilliseconds: true, suppressSeconds: true});
    }
}