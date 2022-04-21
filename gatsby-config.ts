import {GatsbyConfig} from "gatsby";
import * as path from "path";

const config: GatsbyConfig = {
    siteMetadata: {
        title: `Lunettes App`,
        description: `Lunettes App`,
        author: `Alexander Bittermann`,
        menuLinks: [
            {
                name: 'seminar.reminder',
                link: '/seminar/reminder/'
            }
        ]
    },
    plugins: [
        `gatsby-plugin-sass`,
        {
            resolve: `gatsby-source-package`,
            options: {
                only: ['version'],
            },
        },
        `gatsby-plugin-react-helmet`,
        {
            resolve: `gatsby-source-filesystem`,
            options: {
                name: `images`,
                path: path.resolve(`src/images`),
            },
        },
        `gatsby-transformer-sharp`,
        `gatsby-plugin-sharp`,
        {
            resolve: `gatsby-plugin-manifest`,
            options: {
                name: `Lunettes App`,
                short_name: `Lunettes`,
                start_url: `/`,
                background_color: `#304050`,
                theme_color: `#304050`,
                display: `minimal-ui`,
                icon: `src/images/fbs-icon.png`, // This path is relative to the root of the site.
            },
        },
        {
            resolve: `gatsby-source-filesystem`,
            options: {
                path: path.resolve(`src/locales`),
                name: `locale`
            }
        },
        {
            resolve: `gatsby-plugin-layout`,
            options: {
                component: path.resolve(`./src/components/Layout.tsx`),
            },
        },
        {
            resolve: `gatsby-plugin-react-i18next`,
            options: {
                localeJsonSourceName: `locale`, // name given to `gatsby-source-filesystem` plugin.
                languages: ['ja', 'en'],
                defaultLanguage: 'ja',
                // if you are using Helmet, you must include siteUrl, and make sure you add http:https
                siteUrl: `https://example.com/`,
                // you can pass any i18next options
                i18nextOptions: {
                    defaultNS: 'common',
                    //debug: true,
                    lowerCaseLng: true,
                    saveMissing: false,
                    interpolation: {
                        escapeValue: false // not needed for react as it escapes by default
                    },
                    nsSeparator: false,
                },
            }
        },
        `gatsby-plugin-portal`
        // this (optional) plugin enables Progressive Web App + Offline functionality
        // To learn more, visit: https://gatsby.dev/offline
        // `gatsby-plugin-offline`,
    ],
}

export default config;