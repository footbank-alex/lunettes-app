import {API} from "aws-amplify";
import {DateTime} from "luxon";

export namespace Endpoints {
    export interface Endpoint {
        id: string;
        itemName: string;
        dateTime: DateTime;
    }

    export async function get(phoneNumber: string): Promise<Endpoint[]> {
        const endpoints: [{ id: string, itemName: string, dateTime: string }] = await API.get('lunettes', `/endpoints/${phoneNumber}`, {});
        return endpoints.map(value => ({
            id: value.id,
            itemName: value.itemName,
            dateTime: DateTime.fromISO(value.dateTime)
        })).sort((a, b) => a.itemName.localeCompare(b.itemName) || a.dateTime.toMillis() - b.dateTime.toMillis());
    }

    export async function remove(endpoint: Endpoint) {
        return await API.del('lunettes', `/endpoint/${endpoint.id}`, {});
    }

    export async function update(endpoint: Endpoint, dateTime: DateTime) {
        return await API.put('lunettes', `/endpoint/${endpoint.id}`, {body: {dateTime: dateTime.toJSON()}});
    }
}