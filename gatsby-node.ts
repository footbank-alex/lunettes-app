import {GatsbyNode} from "gatsby";

export const createSchemaCustomization: GatsbyNode["createSchemaCustomization"] = ({actions}) => {
    actions.createTypes(`
        type Site {
            siteMetadata: SiteMetadata!
        }
        type SiteMetadata {
            title: String!
            description: String!
            menuLinks: [MenuLink!]!
        }
        type MenuLink {
            name: String!
            link: String!
        }
        type Package implements Node {
            version: String!
        }
  `)
}