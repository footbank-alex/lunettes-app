import {Endpoints} from "./src/api/endpoint";
import {DateTime} from "luxon";

export const getEndpointsResponse: Endpoints.Endpoint[] = Array.from(Array(30).keys()).map(value => ({
    id: value.toString(),
    itemName: `Test ${value + 1}`,
    dateTime: DateTime.now().plus({days: value}).toJSON()
}));