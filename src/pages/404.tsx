import * as React from "react";
import Layout from "../components/Layout";
import {Heading, Text} from "@aws-amplify/ui-react";
import {graphql} from "gatsby";
import '@aws-amplify/ui-react/styles.css';
import '../styles/global.css';
import "normalize.css"

const NotFoundPage = () => (
    <Layout>
        <Heading level={1}>NOT FOUND</Heading>
        <Text>You just hit a route that doesn&#39;t exist... the sadness.</Text>
    </Layout>
);

export const query = graphql`
  query ($language: String!) {
    locales: allLocale(filter: {ns: {in: ["common"]}, language: {eq: $language}}) {
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


export default NotFoundPage;