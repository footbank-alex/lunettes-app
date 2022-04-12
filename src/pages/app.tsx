import * as React from "react"
import {Router} from "@reach/router";
import {Authenticator, Flex, translations, useAuthenticator} from "@aws-amplify/ui-react";
import {I18n} from "aws-amplify";
import Home from "../components/home";
import Layout from "../components/layout";

I18n.putVocabularies(translations);
I18n.setLanguage('ja');
I18n.putVocabulariesForLanguage('ja', {
    'User does not exist.': 'ユーザーが存在しません。',
    'Send code': '認証コード送信',
    'Incorrect username or password.': 'ユーザー名またはパスワードが間違っています。'
});

export default function App() {
    const {route} = useAuthenticator(context => [context.route]);

    return (
        <Layout>
            {route === 'authenticated' ?
                <Router basepath="/">
                    <Home default/>
                </Router>
                :
                <Flex alignItems="center" justifyContent="center" marginTop="25vh">
                    <Authenticator hideSignUp={true}/>
                </Flex>
            }
        </Layout>

    );
}
