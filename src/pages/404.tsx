import * as React from "react";
import {Heading, Text} from "@aws-amplify/ui-react";
import {graphql} from "gatsby";

const NotFoundPage = () =>
    <>
        <Heading level={1}>NOT FOUND</Heading>
        <Text>You just hit a route that doesn&#39;t exist... the sadness.</Text>
    </>;

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