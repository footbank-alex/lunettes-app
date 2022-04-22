import {strHasLength} from "./common";

export const itemHasText = (item: unknown, text: string): boolean => {
    if (strHasLength(item)) {
        return item.toLowerCase().includes(text.toLowerCase());
    }

    if (typeof item === 'object' && item !== null) {
        return itemHasText(item.toString(), text);
    }

    return false;
};