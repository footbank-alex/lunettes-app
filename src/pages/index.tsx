import * as React from "react"
import {Authenticator, Flex, useAuthenticator} from "@aws-amplify/ui-react";
import '@aws-amplify/ui-react/styles.css';
import '../styles/global.css';
import "normalize.css"
import {Router} from "@reach/router";
import Home from "../components/home";
import {graphql} from "gatsby";
import Layout from "../components/layout";

const IndexPage = () => {
    const {route} = useAuthenticator(context => [context.route]);

    return (
        <Layout>
            {route === 'authenticated' ?
                (<Router basepath="/">
                    <Home default/>
                </Router>)
                :
                (<Flex alignItems="center" justifyContent="center" marginTop="25vh">
                    <Authenticator hideSignUp={true}/>
                </Flex>)
            }
        </Layout>)
};

export default IndexPage;

export const query = graphql`
  query ($language: String!) {
    locales: allLocale(filter: {ns: {in: ["common", "index"]}, language: {eq: $language}}) {
      edges {
        node {
          ns
          data
          language
        }
      }
    }
  }
`;
