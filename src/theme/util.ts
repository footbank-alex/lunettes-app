const flipper: { [key: number]: number } = {
    100: 10,
    90: 20,
    80: 40,
    60: 60,
    40: 80,
    20: 90,
    10: 100,
};

export const flipPalette = (obj: { [key: number]: { value: string } }) => {
    return Object.keys(obj).reduce((acc, curr) => {
        const {value} = obj[+curr];
        return {
            ...acc,
            [flipper[+curr]]: {value},
        };
    }, {});
};