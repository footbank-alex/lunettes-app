import * as React from "react";
import type {GatsbyBrowser} from "gatsby";
import lunettesTheme from "./src/theme/lunettesTheme";
import {AmplifyProvider, Authenticator, translations} from "@aws-amplify/ui-react";
import {Amplify, I18n} from "aws-amplify";
import config from './src/aws-exports';
import {Settings} from "luxon";

Amplify.configure(config);

I18n.putVocabularies(translations);
I18n.putVocabulariesForLanguage('ja', {
    'User does not exist.': 'ユーザーが存在しません。',
    'Send code': '認証コード送信',
    'Incorrect username or password.': 'ユーザー名またはパスワードが間違っています。',
    'Signing in': 'サインイン中'
});

Settings.defaultZone = 'Japan';

export const wrapRootElement: GatsbyBrowser["wrapRootElement"] = ({element}) => {
    return (
        <AmplifyProvider theme={lunettesTheme} colorMode="system">
            <Authenticator.Provider>
                {element}
            </Authenticator.Provider>
        </AmplifyProvider>
    )
}