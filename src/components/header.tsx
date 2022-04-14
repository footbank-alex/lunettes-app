import * as React from "react"
import {Link} from "gatsby";
import {Divider, Grid, Heading, Menu, MenuItem, useAuthenticator, useTheme, View} from "@aws-amplify/ui-react";
import {useI18next, useTranslation} from "gatsby-plugin-react-i18next";
import setLanguage from "../language/language";

interface HeaderProps {
    siteTitle: string,
}

const Header = (props: HeaderProps) => {
    const {route, signOut} = useAuthenticator();
    const {tokens} = useTheme();
    const {language, languages, changeLanguage} = useI18next();
    const {t} = useTranslation();

    async function changeLng(lng: string) {
        await changeLanguage(lng);
        setLanguage(lng);
    }

    return (<View backgroundColor={tokens.colors.brand.primary[80]} marginBottom="1.45rem">
        <Grid templateColumns="repeat(3, 1fr)" justifyContent="center">
            <Heading color={tokens.colors.white} level={1} columnStart="2" margin="auto">
                <Link to="/" style={styles.headerTitle}>
                    {props.siteTitle}
                </Link>
            </Heading>
            <Menu size="small" marginLeft="auto">
                {languages.map((lng) => {
                    return <MenuItem key={lng} {...(lng === language ? {
                        isDisabled: true,
                        backgroundColor: tokens.colors.background.info
                    } : {})} onClick={async () => await changeLng(lng)}>{t(`languages.${lng}`)}</MenuItem>
                })}

                <Divider/>
                {route === "authenticated" &&
                    <MenuItem onClick={signOut}>
                        {t('button.signOut')}
                    </MenuItem>}
            </Menu>
        </Grid>
    </View>);
};

const styles = {
    headerTitle: {
        textDecoration: "none",
    }
};

export default Header;
