import * as React from "react"
import {ReactNode} from "react"
import {node} from "prop-types";
import {graphql, StaticQuery} from "gatsby";
import {Helmet, useI18next} from "gatsby-plugin-react-i18next";
import NavBar from "./NavBar";
import {Authenticator, Flex, Heading, useTheme, View} from "@aws-amplify/ui-react";
import setLanguage from "../language/language";
import {
    DefaultComponents
} from "@aws-amplify/ui-react/dist/types/components/Authenticator/hooks/useCustomComponents/defaultComponents";
import Copyright from "./Copyright";
import LanguageSelector from "./LanguageSelector";
import PageRibbon from "./PageRibbon";
import config from '../aws-exports';

interface LayoutProps {
    children: ReactNode
}

const authenticatorComponents = (heading: string): DefaultComponents => ({
    Header() {
        const {tokens} = useTheme();

        return (
            <View textAlign="center" padding={tokens.space.large}>
                <Heading level={1}>{heading}</Heading>
            </View>
        );
    },

    Footer() {
        const {tokens} = useTheme();

        return (
            <View textAlign="center" padding={tokens.space.large}>
                <Flex direction="column" alignItems="center">
                    <LanguageSelector/>
                    <Copyright/>
                </Flex>
            </View>
        );
    }
});

function getEnvFromAwsExports() {
    const envs = config.aws_cloud_logic_custom
        .filter((value: { name: string, endpoint: string }) => value.name === 'lunettes' && value.endpoint)
        .map((value: { endpoint: string }) => value.endpoint?.substring(value.endpoint?.lastIndexOf('/') + 1));
    return envs && envs.length > 0 ? envs[0] : 'dev';
}

const Layout = ({children}: LayoutProps) => {
    const env = process.env.REACT_APP_BUILD_ENV || getEnvFromAwsExports();
    const {language} = useI18next();
    setLanguage(language);

    return (
        <StaticQuery
            query={graphql`
          query SiteTitleQuery {
            site {
              siteMetadata {
                title
                description
                menuLinks {
                  name
                  link
                }
              }
            }
            package {
              version
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
                        <html lang={language}/>
                    </Helmet>
                    {env !== 'prod' && <PageRibbon env={env}/>}
                    <Authenticator key={language} hideSignUp
                                   components={authenticatorComponents(data.site.siteMetadata.title)}>
                        {() =>
                            <Flex>
                                <NavBar siteTitle={data.site.siteMetadata.title}
                                        menuLinks={data.site.siteMetadata.menuLinks}
                                        version={data.package.version}/>
                                <main>
                                    {children}
                                </main>
                            </Flex>
                        }
                    </Authenticator>
                </>
            )}
        />
    );
};

Layout.propTypes = {
    children: node.isRequired,
};

export default Layout;
