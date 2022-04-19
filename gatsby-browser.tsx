import * as React from "react";
import type {GatsbyBrowser} from "gatsby";
import lunettesTheme from "./src/theme/lunettesTheme";
import {AmplifyProvider, Authenticator, translations} from "@aws-amplify/ui-react";
import {Amplify, I18n} from "aws-amplify";
import config from './src/aws-exports';
import {Settings} from "luxon";
import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import {getEndpointsResponse} from "./mock-data";

Amplify.configure(config);

I18n.putVocabularies(translations);
I18n.putVocabulariesForLanguage('ja', {
    'User does not exist.': 'ユーザーが存在しません。',
    'Send code': '認証コード送信',
    'Incorrect username or password.': 'ユーザー名またはパスワードが間違っています。',
    'Signing in': 'サインイン中'
});

Settings.defaultZone = 'Japan';

if (process.env.GATSBY_MOCK) {
    console.log("MOCK");
    const mock = new MockAdapter(axios);

    mock
        .onGet(/\/endpoints\/.+$/)
        .reply(200, getEndpointsResponse)
        .onDelete(/\/endpoint\/.+$/)
        .reply(200)
        .onPut(/\/endpoint\/.+$/)
        .reply(200)
        .onAny()
        .reply(config => {
            console.log(config.url);
            return [200, {}];
        });
}

export const wrapRootElement: GatsbyBrowser["wrapRootElement"] = ({element}) => {
    return (
        <AmplifyProvider theme={lunettesTheme} colorMode="system">
            <Authenticator.Provider>
                {element}
            </Authenticator.Provider>
        </AmplifyProvider>
    )
}