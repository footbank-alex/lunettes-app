import * as React from "react"
import {graphql} from "gatsby";
import '@aws-amplify/ui-react/styles.css';
import '../styles/global.css';
import "normalize.css"

const IndexPage = () => {
};

export default IndexPage;

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
