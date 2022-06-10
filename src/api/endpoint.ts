import {API} from "aws-amplify";
import {DateTime} from "luxon";
import {TFunction} from "react-i18next";

export class Endpoint {
    constructor(public id: string, public itemName: string, public dateTime?: DateTime) {
    }

    get dateTimeString() {
        return this.dateTime?.toLocaleString(DateTime.DATETIME_MED);
    }

    get onHold() {
        return !this.dateTime;
    }

    toString(t: TFunction) {
        return this.itemName + " " + (this.onHold ? `(${t('endpoint.onHold')})` : this.dateTimeString);
    }
}

export namespace Endpoints {

    export async function get(phoneNumber: string): Promise<Endpoint[]> {
        const endpoints: [{ id: string, itemName: string, dateTime: string }] = await API.get('lunettes', `/endpoints/${phoneNumber}`, {});
        return endpoints.map(value => new Endpoint(
            value.id,
            value.itemName,
            value.dateTime ? DateTime.fromISO(value.dateTime) : undefined
        )).sort((a, b) => a.itemName.localeCompare(b.itemName) || (a.dateTime?.toMillis() || 0) - (b.dateTime?.toMillis() || 0));
    }

    export async function remove(endpoint: Endpoint) {
        return await API.del('lunettes', `/endpoint/${endpoint.id}`, {});
    }

    export async function update(endpoint: Endpoint, dateTime?: DateTime) {
        let body = {};
        if (dateTime) {
            body = {dateTime: dateTime.toJSON()};
        }
        return await API.put('lunettes', `/endpoint/${endpoint.id}`, {body});
    }
}