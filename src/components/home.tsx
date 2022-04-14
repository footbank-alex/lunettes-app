import * as React from "react"
import {useState} from "react"
import {RouteComponentProps} from "@reach/router";
import {
    Alert,
    Button,
    Card,
    Collection,
    Flex,
    Heading,
    Icon,
    Loader,
    SearchField,
    Text,
    useTheme,
    View
} from "@aws-amplify/ui-react";
import {DateTime} from "luxon";
import {MdDelete} from "@react-icons/all-files/md/MdDelete";
import {MdEdit} from "@react-icons/all-files/md/MdEdit";
import {Endpoints} from "../api/endpoint";
import {PortalWithState} from "react-portal";
import Modal from "./modal";
import {useI18next} from "gatsby-plugin-react-i18next";
import DateTimePicker from "react-datetime-picker";
import Endpoint = Endpoints.Endpoint;

const Home = (_: RouteComponentProps) => {
    const theme = useTheme();
    const {t, language} = useI18next();

    const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
    const [searchValue, setSearchValue] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [newDateTime, setNewDateTime] = useState(new Date());

    function handleError(e: unknown) {
        console.error(e);
        if (typeof e === 'string') {
            setError(e);
        } else if (e instanceof Error) {
            setError(e.message);
        } else {
            setError(t('search.error.unexpected'));
        }
    }

    async function search(value: string) {
        setSearchValue(value);
        setLoading(true);
        setError('');
        try {
            const endpoints: Endpoint[] = await Endpoints.get(value);
            setEndpoints(endpoints);
        } catch (e: unknown) {
            handleError(e);
        } finally {
            setLoading(false);
        }
    }

    async function remove(endpoint: Endpoint, closePortal: () => void) {
        setError('');
        try {
            await Endpoints.remove(endpoint);
            await search(searchValue);
        } catch (e: unknown) {
            handleError(e);
        } finally {
            closePortal();
        }
    }

    async function update(endpoint: Endpoint, closePortal: () => void) {
        setError('');
        try {
            await Endpoints.update(endpoint, DateTime.fromJSDate(newDateTime));
            await search(searchValue);
        } catch (e: unknown) {
            handleError(e);
        } finally {
            closePortal();
        }
    }

    return (
        <View>
            <Heading level={1}>{t('heading')}</Heading>
            <SearchField label={t('search.label')} placeholder={t('search.placeholder')} onSubmit={search}/>
            {!!error &&
                <Alert variation="error" isDismissible={true} hasIcon={true} heading={t('search.error.heading')}>
                    error
                </Alert>}
            {loading ? <Loader size="large"/> : !endpoints || endpoints.length <= 0 ?
                <Alert variation="info">{t('search.result.empty')}</Alert>
                :
                <Collection type="list" items={endpoints} isPaginated itemsPerPage={20} gap="1.5rem"
                            isSearchable searchPlaceholder={t('search.result.search.placeholder')}>
                    {(item, index) => (
                        <Card key={index} padding="1rem">
                            <Flex justifyContent="space-between" alignItems="center">
                                <Text>{item.itemName} {DateTime.fromISO(item.dateTime).toLocaleString(DateTime.DATETIME_MED)}</Text>
                                <Flex gap="0.5rem">
                                    <PortalWithState node={document && document.getElementById('portal')}
                                                     closeOnOutsideClick closeOnEsc>
                                        {({openPortal, closePortal, portal}) => (
                                            <>
                                                <Button onClick={(event) => {
                                                    setNewDateTime(DateTime.fromISO(item.dateTime).toJSDate());
                                                    openPortal(event);
                                                }} gap="0.2rem"
                                                        backgroundColor={theme.tokens.colors.background.info}>
                                                    <Icon ariaLabel="Update" as={MdEdit}/> {t('update.text')}
                                                </Button>
                                                {portal(
                                                    <Modal>
                                                        <DateTimePicker locale={language} onChange={setNewDateTime}
                                                                        value={newDateTime}/>
                                                        <Button
                                                            onClick={async () => await update(item, closePortal)}
                                                            backgroundColor={theme.tokens.colors.background.info}>
                                                            {t('button.save')}
                                                        </Button>
                                                        <Button onClick={closePortal}>
                                                            {t('button.cancel')}
                                                        </Button>
                                                    </Modal>
                                                )}
                                            </>
                                        )}
                                    </PortalWithState>
                                    <PortalWithState node={document && document.getElementById('portal')}
                                                     closeOnOutsideClick closeOnEsc>
                                        {({openPortal, closePortal, portal}) => (
                                            <>
                                                <Button onClick={openPortal} gap="0.2rem"
                                                        backgroundColor={theme.tokens.colors.background.error}>
                                                    <Icon ariaLabel="Delete" as={MdDelete}/> {t('delete.text')}
                                                </Button>
                                                {portal(
                                                    <Modal>
                                                        <Heading level={4}>{t('delete.modal.heading')}</Heading>
                                                        <Text fontSize="large">{t('delete.modal.content')}</Text>
                                                        <Button
                                                            onClick={async () => await remove(item, closePortal)}
                                                            backgroundColor={theme.tokens.colors.background.error}>
                                                            {t('button.delete')}
                                                        </Button>
                                                        <Button onClick={closePortal}>
                                                            {t('button.cancel')}
                                                        </Button>
                                                    </Modal>
                                                )}
                                            </>
                                        )}
                                    </PortalWithState>
                                </Flex>
                            </Flex>
                        </Card>
                    )}
                </Collection>
            }
        </View>
    );
};

export default Home;