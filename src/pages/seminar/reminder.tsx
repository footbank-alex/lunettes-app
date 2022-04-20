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
    useTheme,
    View
} from "@aws-amplify/ui-react";
import {DateTime} from "luxon";
import {PortalWithState} from "react-portal";
import {useI18next} from "gatsby-plugin-react-i18next";
import DateTimePicker from "react-datetime-picker";
import {Endpoints} from "../../api/endpoint";
import Modal from "../../components/Modal";
import {graphql} from "gatsby";
import {getPortalNode} from "../../utils/portal";
import {isValidPhoneNumber} from "../../utils/validation";
import {MdCancel, MdDelete, MdEdit, MdSave} from "react-icons/md";
import Endpoint = Endpoints.Endpoint;

export default () => {
    const {tokens} = useTheme();
    const {t, language} = useI18next();

    const [searchValue, setSearchValue] = useState('');
    const [searchValid, setSearchValid] = useState(true);
    const [loading, setLoading] = useState(false);
    const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
    const [error, setError] = useState('');
    const [newDateTime, setNewDateTime] = useState(new Date());
    const [updating, setUpdating] = useState(false);

    function handleError(e: unknown) {
        console.error(e);
        if (typeof e === 'string') {
            setError(e);
        } else if (e instanceof Error) {
            console.log(e);
            // @ts-ignore
            const message = e.response?.data?.error || e.message;
            setError(t(`serverErrors.${message}`, message));
        } else {
            setError(t('search.error.unexpected'));
        }
    }

    async function search(value: string) {
        setSearchValid(true);
        setEndpoints([]);
        setSearchValue(value);
        setError('');
        if (value) {
            if (isValidPhoneNumber(value)) {
                setLoading(true);
                try {
                    const endpoints: Endpoint[] = await Endpoints.get(value);
                    setEndpoints(endpoints);
                } catch (e: unknown) {
                    handleError(e);
                } finally {
                    setLoading(false);
                }
            } else {
                setSearchValid(false);
            }
        }
    }

    async function remove(endpoint: Endpoint, closePortal: () => void) {
        setError('');
        setUpdating(true);
        try {
            await Endpoints.remove(endpoint);
            await search(searchValue);
        } catch (e: unknown) {
            handleError(e);
        } finally {
            setUpdating(false);
            closePortal();
        }
    }

    async function update(endpoint: Endpoint, closePortal: () => void) {
        setError('');
        setUpdating(true);
        try {
            await Endpoints.update(endpoint, DateTime.fromJSDate(newDateTime));
            await search(searchValue);
        } catch (e: unknown) {
            handleError(e);
        } finally {
            setUpdating(false);
            closePortal();
        }
    }

    function dateTimeError() {
        if (!newDateTime) {
            return 'dateTimeEmpty';
        } else if (DateTime.fromJSDate(newDateTime) <= DateTime.now()) {
            return 'dateTimeInPast';
        }
        return null;
    }

    return (
        <Flex direction="column">
            <Heading level={1}>{t('heading')}</Heading>
            <SearchField labelHidden={false} label={t('search.label')}
                         placeholder={t('search.placeholder')}
                         onSubmit={search} hasError={!searchValid}
                         errorMessage={t('search.validation.invalidPhoneNumber')}/>
            {!!error &&
                <Alert variation="error" isDismissible={true} hasIcon={true} heading={t('search.error.heading')}>
                    {error}
                </Alert>}
            {loading && <Loader alignSelf="center" size="large"/>}
            {searchValue && searchValid && !loading && (!endpoints || endpoints.length <= 0) &&
                <Alert variation="info">{t('search.result.empty')}</Alert>}
            {endpoints && endpoints.length > 0 &&
                <Collection type="list" items={endpoints} isPaginated itemsPerPage={20} gap={0}
                            isSearchable searchPlaceholder={t('search.result.search.placeholder')}>
                    {(item, index) => (
                        <Card key={index}
                              backgroundColor={index % 2 == 0 ? tokens.colors.background.secondary : undefined}
                              padding="0.5rem">
                            <Flex justifyContent="space-between" alignItems="center">
                                <Text>{item.itemName} {item.dateTime.toLocaleString(DateTime.DATETIME_MED)}</Text>
                                <ButtonGroup>
                                    <PortalWithState node={getPortalNode()} closeOnEsc>
                                        {({openPortal, closePortal, portal}) => (
                                            <>
                                                <Button onClick={(event) => {
                                                    setNewDateTime(item.dateTime.toJSDate());
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
                                                            <Flex className="amplify-field amplify-textfield">
                                                                <DateTimePicker required
                                                                                minDate={DateTime.now().toJSDate()}
                                                                                locale={language}
                                                                                onChange={setNewDateTime}
                                                                                value={newDateTime}/>
                                                                {dateTimeError() &&
                                                                    <View
                                                                        className="amplify-field__error-message">{t(`update.validation.${dateTimeError()}`)}</View>}
                                                            </Flex>
                                                            <ButtonGroup className="modal-buttons">
                                                                <Button isLoading={updating}
                                                                        disabled={!!dateTimeError()}
                                                                        onClick={async () => await update(item, closePortal)}
                                                                        backgroundColor={tokens.colors.background.info}>
                                                                    <Icon ariaLabel="Save"
                                                                          as={MdSave}/> {t('button.save')}
                                                                </Button>
                                                                <Button onClick={closePortal} disabled={updating}>
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
                                    <PortalWithState node={getPortalNode()} closeOnEsc>
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
                                                                <Button isLoading={updating}
                                                                        onClick={async () => await remove(item, closePortal)}
                                                                        backgroundColor={tokens.colors.background.error}>
                                                                    <Icon ariaLabel="Delete"
                                                                          as={MdDelete}/> {t('button.delete')}
                                                                </Button>
                                                                <Button onClick={closePortal} disabled={updating}>
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
