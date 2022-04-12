import * as React from "react"
import {Link} from "gatsby";
import {Button, Grid, Heading, useAuthenticator, useTheme, View} from "@aws-amplify/ui-react";

const Header = ({siteTitle}: { siteTitle: string }) => {
    const {route, signOut} = useAuthenticator();
    const {tokens} = useTheme();
    return (<View backgroundColor={tokens.colors.brand.primary[80]} marginBottom="1.45rem">
        <Grid templateColumns="repeat(3, 1fr)" justifyContent="center">
            <Heading level={1} columnStart="2" margin="auto">
                <Link to="/" style={styles.headerTitle}>
                    {siteTitle}
                </Link>
            </Heading>
            {route === "authenticated" &&
                <Button onClick={signOut} marginLeft="auto">
                    Sign out
                </Button>}
        </Grid>
    </View>);
};

const styles = {
    headerTitle: {
        color: "white", textDecoration: "none",
    }, link: {
        cursor: "pointer", color: "white", textDecoration: "underline",
    },
};

export default Header;
