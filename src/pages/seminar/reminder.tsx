import * as React from "react"
import {useState} from "react"
import {Alert, Collection, Flex, Heading, Loader, SearchField} from "@aws-amplify/ui-react";
import {useI18next} from "gatsby-plugin-react-i18next";
import {graphql} from "gatsby";
import {isValidPhoneNumber} from "../../utils/validation";
import SeminarReminder from "../../components/seminar/SeminarReminder";
import {handleError} from "../../api/utils";
import {itemHasText} from "../../utils/search";
import {Seminar, Seminars} from "../../api/seminar";

export default () => {
    const {t} = useI18next();

    const [searchValue, setSearchValue] = useState('');
    const [searchValid, setSearchValid] = useState(true);
    const [loading, setLoading] = useState(false);
    const [seminars, setSeminars] = useState<Seminar[]>([]);
    const [error, setError] = useState('');

    async function search(value: string) {
        setSearchValid(true);
        setSeminars([]);
        setSearchValue(value);
        setError('');
        if (value) {
            if (isValidPhoneNumber(value)) {
                setLoading(true);
                try {
                    const seminars = await Seminars.get(value);
                    setSeminars(seminars);
                } catch (e: unknown) {
                    handleError(e, setError, t);
                } finally {
                    setLoading(false);
                }
            } else {
                setSearchValid(false);
            }
        }
    }

    return (
        <Flex direction="column">
            <Heading level={1}>{t('heading')}</Heading>
            <SearchField labelHidden={false} label={t('search.label')}
                         placeholder={t('search.placeholder')}
                         onSubmit={search} hasError={!searchValid}
                         errorMessage={t('search.validation.invalidPhoneNumber')}/>
            {!!error &&
                <Alert variation="error" isDismissible={true} hasIcon={true} heading={t('serverErrors.heading')}>
                    {error}
                </Alert>}
            {loading && <Loader alignSelf="center" size="large"/>}
            {searchValue && searchValid && !loading && (!seminars || seminars.length <= 0) &&
                <Alert variation="info">{t('search.result.empty')}</Alert>}
            {seminars && seminars.length > 0 &&
                <Collection type="list" items={seminars} isPaginated itemsPerPage={20} gap={0}
                            isSearchable
                            searchFilter={(item, searchText) => itemHasText((item as Seminar).toString(t), searchText)}
                            searchPlaceholder={t('search.result.search.placeholder')}>
                    {(item, index) => (
                        <SeminarReminder key={index} index={index} seminar={item}
                                         onUpdate={() => search(searchValue)}/>
                    )}
                </Collection>
            }
        </Flex>
    );
};

export const query = graphql`
    query ($language: String!) {
        locales: allLocale(filter: {ns: {in: ["common", "seminar"]}, language: {eq: $language}}) {
            edges {
                node {
                    ns
                    data
                    language
                }
            }
        }
    }
`;