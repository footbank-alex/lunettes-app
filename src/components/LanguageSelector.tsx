import * as React from "react"
import {Menu, MenuButton, MenuItem, Text} from "@aws-amplify/ui-react";
import {useI18next} from "gatsby-plugin-react-i18next";
import setLanguage from "../language/language";
import "flagpack/dist/flagpack.css";

const languageConfig: { [key: string]: { name: string, countryCode: string } } = {
    ja: {
        name: '日本語',
        countryCode: 'jp'
    },
    en: {
        name: 'English',
        countryCode: 'gb'
    }
}

export default () => {
    const {language, languages, changeLanguage} = useI18next();

    async function changeLng(lng: string) {
        await changeLanguage(lng);
        setLanguage(lng);
    }

    return <Menu trigger={
        <MenuButton>
            <Language language={language}/>
        </MenuButton>
    }>
        {languages.map(lng =>
            <MenuItem key={lng} onClick={() => changeLng(lng)}>
                <Language language={lng}/>
            </MenuItem>
        )}
    </Menu>;
};

interface LanguageProps {
    language: string
}

const Language = ({language}: LanguageProps) => (
    <>
        <span className={`fp fp-rounded ${languageConfig[language].countryCode}`}></span>
        <Text>&nbsp;{languageConfig[language].name}</Text>
    </>
)