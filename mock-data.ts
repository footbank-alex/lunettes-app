import {Endpoint} from "./src/api/endpoint";
import {DateTime} from "luxon";

export const getEndpointsResponse: Endpoint[] = Array.from(Array(30).keys()).map(value => new Endpoint(
    value.toString(),
    `Test ${value + 1}`,
    DateTime.now().plus({days: value})
));