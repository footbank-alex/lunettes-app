import * as React from "react"
import {Button, Collection, Divider, Flex, Heading, Icon, Text, useAuthenticator} from "@aws-amplify/ui-react";
import {Link, useI18next} from "gatsby-plugin-react-i18next";
import {RouterProps} from "@reach/router";
import LanguageSelector from "./LanguageSelector";
import {RiLogoutBoxRLine} from "@react-icons/all-files/ri/RiLogoutBoxRLine";
import Copyright from "./Copyright";

interface NavbarProps extends RouterProps {
    siteTitle: string,
    menuLinks: [{ name: string, link: string }],
    version: string
}

export default (props: NavbarProps) => {
    const {t, navigate} = useI18next();
    const {signOut, user} = useAuthenticator();

    async function logout() {
        signOut();
        await navigate("/");
    }

    return (
        <aside className="sidebar">
            <Flex className="sidebar-inner" direction="column">
                <nav className="sidebar-nav">
                    <Heading level={4}>
                        {props.siteTitle}&nbsp;{props.version}
                    </Heading>
                    <Text fontSize="0.8rem">{t('user')}: {user.username}</Text>
                    <Divider/>
                    <Collection type="list" items={props.menuLinks} gap="1.5rem">
                        {(item) => (
                            <Link key={item.name}
                                  className={`nav-link${props.location?.pathname === item.link ? " current" : ""}`}
                                  to={item.link}>{t(`menu.${item.name}`)}</Link>
                        )}
                    </Collection>
                    <Divider/>
                    <Flex direction="column" position="absolute" bottom="0.2rem" width="100%" gap="0.2rem"
                          padding="0 0.2rem">
                        <LanguageSelector/>
                        <Button onClick={logout}>
                            <Icon ariaLabel="Logout" as={RiLogoutBoxRLine}/> {t('button.signOut')}
                        </Button>
                        <Copyright/>
                    </Flex>
                </nav>
            </Flex>
        </aside>
    );
};