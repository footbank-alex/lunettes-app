import {
    AttributeType,
    CampaignResponse,
    CreateCampaignCommand,
    CreateCampaignCommandInput,
    CreateExportJobCommand,
    CreateExportJobCommandInput,
    CreateSegmentCommand,
    CreateSegmentCommandInput,
    DeleteCampaignCommand,
    DeleteEndpointCommand,
    DeleteSegmentCommand,
    EndpointResponse,
    GetCampaignsCommand,
    GetCampaignsCommandInput,
    GetEndpointCommand,
    GetExportJobCommand,
    GetSegmentsCommand,
    GetSegmentsCommandOutput,
    GetSmsTemplateCommand,
    JobStatus,
    NotFoundException,
    NumberValidateResponse,
    PhoneNumberValidateCommand,
    PinpointClient,
    SendMessagesCommand,
    SendMessagesCommandInput,
    UpdateEndpointCommand,
    UpdateEndpointCommandInput
} from "@aws-sdk/client-pinpoint";
import {createHash, parseDateTime, zenkaku2hankaku} from "./utils";
import {DateTime} from "luxon";
import {CampaignConfig} from "./campaign_config";
import {GetObjectCommand, ListObjectsV2Command, S3Client} from "@aws-sdk/client-s3";
import {Readable} from "stream";
import {createGunzip} from "zlib";

const MESSAGE_TYPE = "TRANSACTIONAL";

const PAGE_SIZE = 200;

const SEGMENT_UID_TAG = 'uid';

const ENDPOINT_ATTRIBUTE_MAX_LENGTH = 100;
const CAMPAIGN_NAME_MAX_LENGTH = 64;
const CAMPAIGN_CONFIGS = [
    new CampaignConfig('lunettes_seminar_reminder_1day', '（1日前）', (dateTime) => dateTime.minus({days: 1})),
    new CampaignConfig('lunettes_seminar_reminder_1hour', '（1時間前）', (dateTime) => dateTime.minus({hours: 1}))
];

const SEMINAR_IDENTIFIER_SEPARATOR = '_';
const SEMINARS_ATTRIBUTE_KEY = 'Seminars';
const SEMINAR_MAX_COUNT = 50;

type Seminar = { endpointId: string, id: number, itemName: string, dateTime?: DateTime };

export class PinpointAPI {
    private readonly pinpoint: PinpointClient;
    private readonly projectId: string;

    constructor(region: string, projectId: string) {
        this.pinpoint = new PinpointClient({region: region});
        this.projectId = projectId;
    }

    static generateSeminarIdentifier(itemName: string, dateTime?: DateTime): string {
        const dateSuffix = dateTime ? SEMINAR_IDENTIFIER_SEPARATOR + this.formatDate(dateTime) : '';
        return itemName.substring(0, ENDPOINT_ATTRIBUTE_MAX_LENGTH - dateSuffix.length) + dateSuffix;
    }

    static generateSegmentName(itemName: string, dateTime: DateTime): string {
        const dateSuffix = '_' + this.formatDate(dateTime);

        // since campaign names have a limit of 64 characters and segment name will be used in the campaign name
        // we have to calculate max length for the segment name prefix
        return itemName.substring(0,
            CAMPAIGN_NAME_MAX_LENGTH - dateSuffix.length - Math.max(
                ...CAMPAIGN_CONFIGS.map(config => config.nameSuffix.length))) + dateSuffix;
    }

    static formatDate(dateTime: DateTime): string {
        return dateTime.toISO(
            {
                format: 'basic',
                suppressMilliseconds: true,
                suppressSeconds: true,
                includeOffset: false
            });
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
        return data.NumberValidateResponse!;
    }

    async getSeminars(numberValidateResponse: NumberValidateResponse): Promise<Seminar[]> {
        const endpointId = PinpointAPI.getEndpointId(numberValidateResponse.CleansedPhoneNumberE164!);
        const endpoint = await this.getEndpoint(endpointId);
        if (!endpoint) {
            console.info(`Endpoint ${endpointId} does not exist, returning empty list of seminars`);
            return [];
        }
        return PinpointAPI.deserializeSeminarIdentifiers(endpointId, endpoint?.Attributes?.[SEMINARS_ATTRIBUTE_KEY] || [])
            .filter(value => !value.dateTime || value.dateTime > DateTime.local());
    }

    async addSeminar(numberValidateResponse: NumberValidateResponse, name: string, itemName: string, dateTime: DateTime) {
        const destinationNumber = numberValidateResponse.CleansedPhoneNumberE164!;
        const endpointId = PinpointAPI.getEndpointId(destinationNumber);
        const seminarIdentifier = PinpointAPI.generateSeminarIdentifier(itemName, dateTime);
        const seminarIdentifiers = [];
        const endpoint = await this.getEndpoint(endpointId);
        seminarIdentifiers.push(...endpoint?.Attributes?.[SEMINARS_ATTRIBUTE_KEY] || [], seminarIdentifier);
        const seminars = PinpointAPI.removeOldSeminars(
            PinpointAPI.deserializeSeminarIdentifiers(endpointId, seminarIdentifiers)
        );
        if (seminars.length > SEMINAR_MAX_COUNT) {
            // delete oldest on hold seminar, if there is none just delete first/oldest seminar
            let indexToDelete = seminars.findIndex(value => !value.dateTime);
            if (indexToDelete < 0) {
                indexToDelete = 0;
            }
            delete seminars[indexToDelete];
        }

        const params: UpdateEndpointCommandInput = {
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
                    Timezone: numberValidateResponse.Timezone || 'Japan'
                },
                Attributes: {
                    [SEMINARS_ATTRIBUTE_KEY]: PinpointAPI.serializeSeminarIdentifiers(
                        PinpointAPI.removeOldSeminars(
                            PinpointAPI.deserializeSeminarIdentifiers(endpointId, seminarIdentifiers)
                        )
                    )
                },
                User: {
                    UserAttributes: {
                        Name: [
                            name
                        ]
                    },
                    UserId: endpointId
                }
            }
        };
        const response = await this.pinpoint.send(new UpdateEndpointCommand(params));
        await this.createCampaigns(seminarIdentifier, itemName, dateTime);
        console.debug(response);
        return endpointId;
    }

    async updateSeminar(endpointId: string, seminarId: number, newDateTime?: DateTime) {
        const endpoint = await this.getEndpoint(endpointId);
        if (!endpoint) {
            throw `Endpoint ${endpointId} not found`;
        }
        if (!endpoint.Attributes) {
            throw `Invalid endpoint`;
        }

        const seminars = PinpointAPI.deserializeSeminarIdentifiers(endpointId, endpoint.Attributes[SEMINARS_ATTRIBUTE_KEY]);
        const seminar = seminars[seminarId];
        seminar.dateTime = newDateTime;

        const params: UpdateEndpointCommandInput = {
            ApplicationId: this.projectId,
            EndpointId: endpointId,
            EndpointRequest: {
                ...endpoint,
                Attributes: {
                    ...endpoint.Attributes,
                    [SEMINARS_ATTRIBUTE_KEY]: PinpointAPI.serializeSeminarIdentifiers(
                        PinpointAPI.removeOldSeminars(
                            seminars
                        )
                    )
                },
            }
        };
        const response = await this.pinpoint.send(new UpdateEndpointCommand(params));
        console.debug(response);
        if (newDateTime) {
            await this.createCampaigns(PinpointAPI.serializeSeminarIdentifier(seminar), seminar.itemName, newDateTime);
        }
    }

    async deleteSeminar(endpointId: string, seminarId: number) {
        const endpoint = await this.getEndpoint(endpointId);
        if (!endpoint) {
            throw `Endpoint ${endpointId} not found`;
        }
        if (!endpoint.Attributes) {
            throw `Invalid endpoint`;
        }

        const seminars = PinpointAPI.deserializeSeminarIdentifiers(endpointId, endpoint.Attributes[SEMINARS_ATTRIBUTE_KEY]);
        delete seminars[seminarId];

        const params: UpdateEndpointCommandInput = {
            ApplicationId: this.projectId,
            EndpointId: endpointId,
            EndpointRequest: {
                ...endpoint,
                Attributes: {
                    ...endpoint.Attributes,
                    [SEMINARS_ATTRIBUTE_KEY]: PinpointAPI.serializeSeminarIdentifiers(
                        PinpointAPI.removeOldSeminars(
                            seminars
                        )
                    )
                },
            }
        };
        const response = await this.pinpoint.send(new UpdateEndpointCommand(params));
        console.debug(response);
    }

    async getEndpoint(endpointId: string) {
        try {
            const response = await this.pinpoint.send(new GetEndpointCommand({
                ApplicationId: this.projectId,
                EndpointId: endpointId
            }));
            console.debug(response);
            return response.EndpointResponse!;
        } catch (e) {
            console.error(e);
            if (e instanceof NotFoundException) {
                return null;
            }
            throw e;
        }
    }

    async sendConfirmation(endpointId: string, templateName: string, itemName: string, dateTime: DateTime) {
        const messageBody = await this.getMessage(itemName, dateTime, templateName, "3");
        const params: SendMessagesCommandInput = {
            ApplicationId: this.projectId,
            MessageRequest: {
                Endpoints: {
                    [endpointId]: {}
                },
                MessageConfiguration: {
                    SMSMessage: {
                        MessageType: MESSAGE_TYPE,
                        Body: messageBody
                    }
                }
            }
        };

        const data = await this.pinpoint.send(new SendMessagesCommand(params));
        console.debug(data.MessageResponse!.EndpointResult![endpointId].StatusMessage);
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
            if (data.SegmentsResponse!.Item!.some(value => value.tags && value.tags[SEGMENT_UID_TAG] === createHash(uid))) {
                return true;
            }
            token = data.SegmentsResponse!.NextToken;
        } while (token);
        return false;
    }

    async createSegment(seminarIdentifier: string, segmentName: string) {
        const params: CreateSegmentCommandInput = {
            ApplicationId: this.projectId,
            WriteSegmentRequest: {
                Dimensions: {
                    Attributes: {
                        [SEMINARS_ATTRIBUTE_KEY]: {
                            Values: [
                                seminarIdentifier
                            ],
                            AttributeType: AttributeType.INCLUSIVE
                        }
                    }
                },
                Name: segmentName,
                tags: {
                    [SEGMENT_UID_TAG]: createHash(seminarIdentifier)
                }
            }
        };
        const data = await this.pinpoint.send(new CreateSegmentCommand(params));
        console.log('Segment created');
        console.debug(data);
        return data.SegmentResponse!.Id!;
    }

    async createCampaigns(seminarIdentifier: string, itemName: string, dateTime: DateTime) {
        if (CAMPAIGN_CONFIGS.some(config => config.isApplicable(dateTime)) && !await this.segmentExists(seminarIdentifier)) {
            const segmentName = PinpointAPI.generateSegmentName(itemName, dateTime);
            const segmentId = await this.createSegment(seminarIdentifier, segmentName);
            await Promise.all(CAMPAIGN_CONFIGS.filter(config => config.isApplicable(dateTime)).map(
                async config => this.createCampaign(segmentName + config.nameSuffix, segmentId, config.template,
                    config.calculateDateTime(dateTime), itemName, dateTime)));
        }
    }

    async createCampaign(campaignName: string, segmentId: string, templateName: string, startTime: DateTime, itemName: string, dateTime: DateTime) {
        const messageBody = await this.getMessage(itemName, dateTime, templateName, "3");
        const params: CreateCampaignCommandInput = {
            ApplicationId: this.projectId,
            WriteCampaignRequest: {
                MessageConfiguration: {
                    SMSMessage: {
                        MessageType: MESSAGE_TYPE,
                        Body: messageBody
                    }
                },
                Name: campaignName,
                Schedule: {
                    StartTime: startTime.toISO(),
                    Frequency: 'ONCE',
                    Timezone: 'UTC+09'
                },
                SegmentId: segmentId,
            }
        };
        const data = await this.pinpoint.send(new CreateCampaignCommand(params));
        console.log('Campaign created');
        console.debug(data);
        return data.CampaignResponse!.Id!;
    }

    async* getCampaigns(filter: (value: CampaignResponse) => boolean = () => true, pageSize = PAGE_SIZE): AsyncIterableIterator<CampaignResponse> {
        let token = undefined;
        do {
            const params: GetCampaignsCommandInput = {
                ApplicationId: this.projectId,
                PageSize: pageSize.toString(),
                Token: token
            };
            const data = await this.pinpoint.send(new GetCampaignsCommand(params));
            for (const item of data.CampaignsResponse!.Item!.filter(filter)) {
                yield item;
            }
            token = data.CampaignsResponse!.NextToken;
        } while (token);
    }

    async getMessage(itemName: string, dateTime: DateTime, templateName: string, templateVersion?: string) {
        const response = await this.pinpoint.send(new GetSmsTemplateCommand({
            TemplateName: templateName,
            Version: templateVersion
        }));
        if (!response.SMSTemplateResponse?.Body) {
            throw `Could not retrieve message body for template ${templateName}`;
        }
        return response.SMSTemplateResponse.Body
            .replace('__seminar.name__', itemName)
            .replace('__seminar.dateTime__', dateTime.toLocaleString(DateTime.DATETIME_MED));
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

    private static getEndpointId(cleansedPhoneNumber: string) {
        return cleansedPhoneNumber.substring(1);
    }

    private static removeOldSeminars(seminars: Seminar[]) {
        return seminars.filter(value => !value.dateTime || value.dateTime > DateTime.local());
    }

    private static deserializeSeminarIdentifiers(endpointId: string, seminarIdentifiers: string[]): Seminar[] {
        return seminarIdentifiers.map((value, index) => this.deserializeSeminarIdentifier(endpointId, index, value));
    }

    private static deserializeSeminarIdentifier(endpointId: string, index: number, seminarIdentifier: string): Seminar {
        const lastIndex = seminarIdentifier.lastIndexOf(SEMINAR_IDENTIFIER_SEPARATOR);
        return {
            endpointId,
            id: index,
            itemName: lastIndex < 0 ? seminarIdentifier : seminarIdentifier.slice(0, lastIndex),
            dateTime: lastIndex < 0 ? undefined : DateTime.fromISO(seminarIdentifier.slice(lastIndex + 1))
        };
    }

    private static serializeSeminarIdentifiers(seminars: Seminar[]): string[] {
        return seminars.map(value => this.serializeSeminarIdentifier(value));
    }

    private static serializeSeminarIdentifier(seminar: Seminar): string {
        return this.generateSeminarIdentifier(seminar.itemName, seminar.dateTime);
    }

    // MIGRATION CODE
    async exportEndpoints() {
        const directory = DateTime.now().toISO({
            suppressMilliseconds: true,
            includeOffset: false
        });
        const bucket = 'pinpoint-migration-lunettes'
        const keyPrefix = `exports/${directory}`
        const params: CreateExportJobCommandInput = {
            ApplicationId: this.projectId,
            ExportJobRequest: {
                S3UrlPrefix: `s3://${bucket}/${keyPrefix}`,
                RoleArn: 'arn:aws:iam::618741021188:role/s3ExportRole'
            }
        };
        let data = await this.pinpoint.send(new CreateExportJobCommand(params));
        console.log('Export job created');
        console.debug(data);
        const jobId = data.ExportJobResponse!.Id!;

        const maxEndTime = DateTime.now().plus({minutes: 2})
        let completed = false;
        while (!completed && DateTime.now() <= maxEndTime) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            const job = await this.pinpoint.send(new GetExportJobCommand({
                ApplicationId: this.projectId,
                JobId: jobId
            }));
            completed = job.ExportJobResponse?.JobStatus === JobStatus.COMPLETED;
        }

        const endpoints: EndpointResponse[] = [];
        for await (const file of this.getExportFiles(bucket, keyPrefix)) {
            endpoints.push(...file.trim().split('\n').map(value => value.trim()).filter(value => !!value)
                .map(value => {
                    return JSON.parse(value);
                }));
        }
        console.log(`${endpoints.length} endpoints found`);
        return endpoints;
    }

    async migrateEndpoints(endpoints: EndpointResponse[]) {
        const addresses = [...new Set(endpoints.map(value => value.Address!))];
        console.log(`${addresses.length} different addresses found`);

        for (const address of addresses) {
            console.log(`Checking address ${address}`);
            const addressEndpoints = endpoints.filter(value => value.Address === address);
            if (addressEndpoints.length > 0) {
                // consider migrated endpoints as well to make migration idempotent
                const seminars = PinpointAPI.removeOldSeminars(
                    addressEndpoints.filter(value => value.Attributes?.ItemName?.[0] && value.Attributes?.DateTime?.[0] && value.User?.UserAttributes?.Name?.[0])
                        .map(function (value, index): Seminar {
                            return {
                                endpointId: value.Id!,
                                id: index,
                                itemName: value.Attributes!.ItemName[0],
                                dateTime: PinpointAPI.parse(value.Attributes!.DateTime[0])
                            }
                        })
                        .concat(addressEndpoints.filter(value => value.Attributes?.Seminars?.length || 0 > 0).flatMap(value =>
                            PinpointAPI.deserializeSeminarIdentifiers(value.Id!, value.Attributes!.Seminars)
                        )));
                if (seminars.length > 0) {
                    console.log(`Creating new endpoint for address ${address}`);
                    const endpointId = PinpointAPI.getEndpointId(address);
                    const params: UpdateEndpointCommandInput = {
                        ApplicationId: this.projectId,
                        EndpointId: endpointId,
                        EndpointRequest: {
                            ChannelType: 'SMS',
                            Address: address,
                            OptOut: 'NONE',
                            Location: addressEndpoints[0].Location,
                            Demographic: {
                                Timezone: addressEndpoints[0].Demographic?.Timezone || 'Japan'
                            },
                            Attributes: {
                                [SEMINARS_ATTRIBUTE_KEY]: PinpointAPI.serializeSeminarIdentifiers(seminars)
                            },
                            User: {
                                UserAttributes: {
                                    Name: [
                                        addressEndpoints[0].User!.UserAttributes!.Name[0]
                                    ]
                                },
                                UserId: endpointId
                            }
                        }
                    };
                    const response = await this.pinpoint.send(new UpdateEndpointCommand(params));
                    console.debug(response);
                    for (const seminar of seminars) {
                        await this.createCampaigns(PinpointAPI.serializeSeminarIdentifier(seminar), seminar.itemName, seminar.dateTime!);
                    }
                }
            }
        }
    }

    async deleteOldEndpoints(endpoints: EndpointResponse[]) {
        console.log(`Deleting old endpoints`);
        // remove only endpoints with the old ID convention (containing a hash of itemName and dateTime)
        // new endpoints will have Ids equal to the result of getEndpointId
        for (const endpoint of endpoints.filter(value => value.Id !== PinpointAPI.getEndpointId(value.Address!))) {
            const response = await this.pinpoint.send(new DeleteEndpointCommand({
                ApplicationId: this.projectId,
                EndpointId: endpoint.Id
            }));
            console.debug(response);
        }
    }

    async* getExportFiles(
        bucket: string,
        keyPrefix: string
    ): AsyncIterableIterator<string> {
        const s3 = new S3Client({});
        const objects = await s3.send(new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: keyPrefix
        }));
        const promises: Promise<string>[] = objects.Contents!.map(value => value.Key!).filter(value => value.includes('.gz')).map(async (key) => {
            const object = await s3.send(new GetObjectCommand({
                Bucket: bucket,
                Key: key
            }));
            return new Promise((resolve, reject) => {
                if (!object.Body) {
                    reject('No body');
                } else {
                    const chunks: Uint8Array[] = [];
                    const bodyStream = object.Body! as Readable;
                    bodyStream
                        .pipe(createGunzip())
                        .on("data", (chunk) => chunks.push(Buffer.from(chunk)))
                        .on("error", err => reject(err))
                        .on("end", () =>
                            resolve(Buffer.concat(chunks).toString("utf-8"))
                        );
                }
            })
        });
        yield* promises;
    }

    static parse(dateTime: string) {
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
        return undefined;
    }
}