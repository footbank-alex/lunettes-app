import {API} from "aws-amplify";
import {DateTime} from "luxon";
import {TFunction} from "react-i18next";

export class Seminar {
    constructor(public endpointId: string, public id: number, public itemName: string, public dateTime?: DateTime) {
    }

    get dateTimeString() {
        return this.dateTime?.toLocaleString(DateTime.DATETIME_MED);
    }

    get onHold() {
        return !this.dateTime;
    }

    toString(t: TFunction) {
        return this.itemName + " " + (this.onHold ? `(${t('onHold')})` : this.dateTimeString);
    }
}

export namespace Seminars {

    export async function get(phoneNumber: string): Promise<Seminar[]> {
        const endpoints: [{ endpointId: string, id: number, itemName: string, dateTime: string }] =
            await API.get('lunettes', `/seminars/${phoneNumber}`, {});
        return endpoints.map(value => new Seminar(
            value.endpointId,
            value.id,
            value.itemName,
            value.dateTime ? DateTime.fromISO(value.dateTime) : undefined
        )).sort((a, b) => a.itemName.localeCompare(b.itemName) || (a.dateTime?.toMillis() || 0) - (b.dateTime?.toMillis() || 0));
    }

    export async function remove(seminar: Seminar) {
        return await API.del('lunettes', `/seminar/${seminar.endpointId}/${seminar.id}`, {});
    }

    export async function update(seminar: Seminar, dateTime?: DateTime) {
        let body = {};
        if (dateTime) {
            body = {dateTime: dateTime.toJSON()};
        }
        return await API.put('lunettes', `/seminar/${seminar.endpointId}/${seminar.id}`, {body});
    }
}