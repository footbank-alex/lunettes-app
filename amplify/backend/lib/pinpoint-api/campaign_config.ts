import {DateTime} from 'luxon';

export class CampaignConfig {
    public readonly template: string;
    public readonly nameSuffix: string;
    public readonly calculateDateTime: (dateTime: DateTime) => DateTime;

    constructor(template: string, nameSuffix: string, calculateDateTime: (dateTime: DateTime) => DateTime) {
        this.template = template;
        this.nameSuffix = nameSuffix;
        this.calculateDateTime = calculateDateTime;
    }

    isApplicable(dateTime: DateTime) {
        return this.calculateDateTime(dateTime) > DateTime.local();
    }
}