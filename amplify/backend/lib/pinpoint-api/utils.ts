import {DateTime} from "luxon";
import * as crypto from "crypto";

export function parseDateTime(str: string) {
    const [month, day, hour, minute] = str.match(/\d+/g);
    const now = DateTime.local();
    let year = now.year;
    if (!month || !day || !hour || !minute) {
        throw "Could not parse date";
    }
    if (+month < now.month || (+month === now.month && +day < now.day)) {
        year++;
    }
    return DateTime.local(year, +month, +day, +hour, +minute);
}

export function createHash(input: string) {
    return crypto.createHash('sha256', {outputLength: 32}).update(input).digest('hex');
}

export function zenkaku2hankaku(str: string) {
    return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
}