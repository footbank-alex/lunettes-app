import * as React from "react"
import App from "./app";
import {AmplifyProvider, Authenticator, createTheme, defaultTheme} from "@aws-amplify/ui-react";
import config from '../aws-exports';
import {Amplify} from "aws-amplify";
import '@aws-amplify/ui-react/styles.css';
import '../styles/global.css';
import "normalize.css"

Amplify.configure(config)

const flipper: { [key: number]: number } = {
    100: 10,
    90: 20,
    80: 40,
    60: 60,
    40: 80,
    20: 90,
    10: 100,
};

const flipPalette = (obj: { [key: number]: { value: string } }) => {
    return Object.keys(obj).reduce((acc, curr) => {
        const {value} = obj[+curr];
        return {
            ...acc,
            [flipper[+curr]]: {value},
        };
    }, {});
};

const theme = createTheme({
    name: 'lunettes-theme',
    overrides: [
        {
            colorMode: 'dark',
            tokens: {
                colors: {
                    red: flipPalette(defaultTheme.tokens.colors.red),
                    orange: flipPalette(defaultTheme.tokens.colors.orange),
                    yellow: flipPalette(defaultTheme.tokens.colors.yellow),
                    green: flipPalette(defaultTheme.tokens.colors.green),
                    teal: flipPalette(defaultTheme.tokens.colors.teal),
                    blue: flipPalette(defaultTheme.tokens.colors.blue),
                    purple: flipPalette(defaultTheme.tokens.colors.purple),
                    pink: flipPalette(defaultTheme.tokens.colors.pink),
                    neutral: flipPalette(defaultTheme.tokens.colors.neutral),
                    black: {value: '#fff'},
                    white: {value: '#000'},
                    border: {
                        primary: {value: '{colors.neutral.20.value}'},
                        secondary: {value: '{colors.neutral.20.value}'},
                        tertiary: {value: '{colors.neutral.20.value}'},
                    },
                    overlay: {
                        10: {value: 'hsla(0, 0%, 100%, 0.1)'},
                        20: {value: 'hsla(0, 0%, 100%, 0.2)'},
                        30: {value: 'hsla(0, 0%, 100%, 0.3)'},
                        40: {value: 'hsla(0, 0%, 100%, 0.4)'},
                        50: {value: 'hsla(0, 0%, 100%, 0.5)'},
                        60: {value: 'hsla(0, 0%, 100%, 0.6)'},
                        70: {value: 'hsla(0, 0%, 100%, 0.7)'},
                        80: {value: 'hsla(0, 0%, 100%, 0.8)'},
                        90: {value: 'hsla(0, 0%, 100%, 0.9)'},
                    },
                },
            },
        },
    ]
});

const IndexPage = () => (
    <AmplifyProvider theme={theme} colorMode="system">
        <Authenticator.Provider>
            <App/>
        </Authenticator.Provider>
    </AmplifyProvider>
);

export default IndexPage