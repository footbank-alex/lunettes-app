import {Seminar} from "./src/api/seminar";
import {DateTime} from "luxon";

export const getEndpointsResponse: Seminar[] = Array.from(Array(30).keys()).map(value => new Seminar(
    '1',
    value,
    `Test ${value + 1}`,
    DateTime.now().plus({days: value})
));