import * as React from "react"
import {useState} from "react"
import {
    Alert,
    Button,
    ButtonGroup,
    Card,
    Collection,
    Divider,
    Flex,
    Heading,
    Icon,
    Loader,
    SearchField,
    Text,
    useTheme
} from "@aws-amplify/ui-react";
import {DateTime} from "luxon";
import {MdDelete} from "@react-icons/all-files/md/MdDelete";
import {MdEdit} from "@react-icons/all-files/md/MdEdit";
import {PortalWithState} from "react-portal";
import {useI18next} from "gatsby-plugin-react-i18next";
import DateTimePicker from "react-datetime-picker";
import {Endpoints} from "../../api/endpoint";
import Modal from "../../components/Modal";
import {graphql} from "gatsby";
import {MdSave} from "@react-icons/all-files/md/MdSave";
import {MdCancel} from "@react-icons/all-files/md/MdCancel";
import Endpoint = Endpoints.Endpoint;

export default () => {
    const {tokens} = useTheme();
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
            console.log(e);
            // @ts-ignore
            setError(e.response?.data?.error || e.message);
        } else {
            setError(t('search.error.unexpected'));
        }
    }

    async function search(value: string) {
        if (value) {
            setEndpoints([]);
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
        <Flex direction="column">
            <Heading level={1}>{t('heading')}</Heading>
            <SearchField pattern="[0-9+-/]+" labelHidden={false} label={t('search.label')}
                         placeholder={t('search.placeholder')}
                         onSubmit={search}/>
            {!!error &&
                <Alert variation="error" isDismissible={true} hasIcon={true} heading={t('search.error.heading')}>
                    {error}
                </Alert>}
            {loading && <Loader size="large"/>}
            {searchValue && !loading && (!endpoints || endpoints.length <= 0) &&
                <Alert variation="info">{t('search.result.empty')}</Alert>}
            {endpoints && endpoints.length > 0 &&
                <Collection type="list" items={endpoints} isPaginated itemsPerPage={20} gap="1.5rem"
                            isSearchable searchPlaceholder={t('search.result.search.placeholder')}>
                    {(item, index) => (
                        <Card key={index}
                              backgroundColor={index % 2 == 0 ? tokens.colors.background.secondary : undefined}
                              padding="1rem">
                            <Flex justifyContent="space-between" alignItems="center">
                                <Text>{item.itemName} {DateTime.fromISO(item.dateTime).toLocaleString(DateTime.DATETIME_MED)}</Text>
                                <ButtonGroup>
                                    <PortalWithState node={document && document.getElementById('portal')} closeOnEsc>
                                        {({openPortal, closePortal, portal}) => (
                                            <>
                                                <Button onClick={(event) => {
                                                    setNewDateTime(DateTime.fromISO(item.dateTime).toJSDate());
                                                    openPortal(event);
                                                }} backgroundColor={tokens.colors.background.info}>
                                                    <Icon ariaLabel="Update" as={MdEdit}/> {t('update.text')}
                                                </Button>
                                                {portal(
                                                    <Modal>
                                                        <Flex className="modal-content" direction="column">
                                                            <Heading level={4}>{t('update.modal.heading')}</Heading>
                                                            <Divider/>
                                                            <Text
                                                                fontSize="large">{t('update.modal.content')}</Text>
                                                            <DateTimePicker locale={language} onChange={setNewDateTime}
                                                                            value={newDateTime}/>
                                                            <ButtonGroup className="modal-buttons">
                                                                <Button
                                                                    onClick={async () => await update(item, closePortal)}
                                                                    backgroundColor={tokens.colors.background.info}>
                                                                    <Icon ariaLabel="Save"
                                                                          as={MdSave}/> {t('button.save')}
                                                                </Button>
                                                                <Button onClick={closePortal}>
                                                                    <Icon ariaLabel="Cancel"
                                                                          as={MdCancel}/> {t('button.cancel')}
                                                                </Button>
                                                            </ButtonGroup>
                                                        </Flex>
                                                    </Modal>
                                                )}
                                            </>
                                        )}
                                    </PortalWithState>
                                    <PortalWithState node={document && document.getElementById('portal')}
                                                     closeOnEsc>
                                        {({openPortal, closePortal, portal}) => (
                                            <>
                                                <Button onClick={openPortal}
                                                        backgroundColor={tokens.colors.background.error}>
                                                    <Icon ariaLabel="Delete" as={MdDelete}/> {t('delete.text')}
                                                </Button>
                                                {portal(
                                                    <Modal>
                                                        <Flex className="modal-content" direction="column">
                                                            <Heading level={4}>{t('delete.modal.heading')}</Heading>
                                                            <Divider/>
                                                            <Text fontSize="large">{t('delete.modal.content')}</Text>
                                                            <ButtonGroup className="modal-buttons">
                                                                <Button
                                                                    onClick={async () => await remove(item, closePortal)}
                                                                    backgroundColor={tokens.colors.background.error}>
                                                                    <Icon ariaLabel="Delete"
                                                                          as={MdDelete}/> {t('button.delete')}
                                                                </Button>
                                                                <Button onClick={closePortal}>
                                                                    <Icon ariaLabel="Cancel"
                                                                          as={MdCancel}/> {t('button.cancel')}
                                                                </Button>
                                                            </ButtonGroup>
                                                        </Flex>
                                                    </Modal>
                                                )}
                                            </>
                                        )}
                                    </PortalWithState>
                                </ButtonGroup>
                            </Flex>
                        </Card>
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
