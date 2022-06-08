import * as React from "react"
import {
    Button,
    Collection,
    ColorMode,
    Divider,
    Flex,
    Heading,
    Icon,
    Text,
    useAuthenticator
} from "@aws-amplify/ui-react";
import {Link, useI18next} from "gatsby-plugin-react-i18next";
import LanguageSelector from "./LanguageSelector";
import Copyright from "./Copyright";
import ColorModeSwitcher from "./ColorModeSwitcher";
import {MdLogout} from "react-icons/md";

interface NavbarProps {
    siteTitle?: string,
    menuLinks: { readonly name: string, readonly link: string }[],
    version?: string,
    colorMode: ColorMode,
    setColorMode: (value: ColorMode) => void,
    onClick?: React.MouseEventHandler<HTMLAnchorElement>
}

export const Navigation = (props: NavbarProps) => {
    const {t, navigate, path} = useI18next();
    const {signOut, user} = useAuthenticator();

    async function logout() {
        signOut();
        await navigate("/");
    }

    return (
        <nav className="sidebar-nav">
            <Heading level={4}>
                {props.siteTitle}&nbsp;{props.version}
            </Heading>
            <Text fontSize="0.8rem">{t('user')}: {user.username}</Text>
            <Divider/>
            <Collection type="list" items={props.menuLinks} gap="1.5rem">
                {(item) => <Link key={item.name} onClick={props.onClick}
                                 className={`nav-link${path === item.link ? " current" : ""}`}
                                 to={item.link}>{t(`menu.${item.name}`)}</Link>}
            </Collection>
            <Divider/>
            <Flex direction="column" position="absolute" bottom="0.2rem" width="100%" gap="0.2rem"
                  padding="0 0.2rem">
                <ColorModeSwitcher colorMode={props.colorMode} setColorMode={props.setColorMode}/>
                <LanguageSelector/>
                <Button onClick={logout}>
                    <Icon ariaLabel="Logout" as={MdLogout}/> {t('button.signOut')}
                </Button>
                <Copyright/>
            </Flex>
        </nav>
    );
}

export default (props: NavbarProps) =>
    <aside className="sidebar">
        <Flex className="sidebar-inner" direction="column">
            <Navigation {...props} />
        </Flex>
    </aside>;