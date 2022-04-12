import * as React from "react"
import {ReactNode} from "react"
import {node} from "prop-types";
import Helmet from "react-helmet";
import {graphql, StaticQuery} from "gatsby";

import Header from "./header";
import {View} from "@aws-amplify/ui-react";

interface LayoutProps {
    children: ReactNode
}

const Layout = ({children}: LayoutProps) =>
    (
        <StaticQuery
            query={graphql`
          query SiteTitleQuery {
            site {
              siteMetadata {
                title
                description
              }
            }
          }
        `}
            render={(data) => (
                <>
                    <Helmet
                        title={data.site.siteMetadata.title}
                        meta={[
                            {name: "description", content: data.site.siteMetadata.description},
                        ]}>
                        <html lang="ja"/>
                    </Helmet>
                    <Header siteTitle={data.site.siteMetadata.title}/>
                    <View margin="0 auto"
                          padding="0px 1.0875rem 1.45rem"
                          paddingTop="0">
                        {children}
                    </View>
                </>
            )}
        />
    );

Layout.propTypes = {
    children: node.isRequired,
};

export default Layout;
