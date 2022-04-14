import {I18n} from "aws-amplify";
import {Settings} from "luxon";

export default function setLanguage(language: string) {
    I18n.setLanguage(language);
    Settings.defaultLocale = language;
}