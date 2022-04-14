import {API} from "aws-amplify";
import {DateTime} from "luxon";

export namespace Endpoints {
    export interface Endpoint {
        id: string;
        itemName: string;
        dateTime: string;
    }

    export async function get(phoneNumber: string): Promise<Endpoint[]> {
        return await API.get('lunettes', `/endpoints/${phoneNumber}`, {});
    }

    export async function remove(endpoint: Endpoint) {
        return await API.del('lunettes', `/endpoint/${endpoint.id}`, {});
    }

    export async function update(endpoint: Endpoint, dateTime: DateTime) {
        return await API.put('lunettes', `/endpoint/${endpoint.id}`, {body: {dateTime: dateTime.toJSON()}});
    }
}