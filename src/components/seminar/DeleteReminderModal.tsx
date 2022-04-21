import * as React from "react"
import {useState} from "react"
import {Alert, Button, ButtonGroup, Divider, Flex, Heading, Icon, Text, useTheme} from "@aws-amplify/ui-react";
import {MdCancel, MdDelete} from "react-icons/md";
import Modal from "../Modal";
import {Endpoints} from "../../api/endpoint";
import {useI18next} from "gatsby-plugin-react-i18next";
import {handleError} from "../../api/utils";

interface UpdateReminderModalProps {
    endpoint: Endpoints.Endpoint;
    close: () => void;
    onDelete: () => void;
}

export default ({endpoint, close, onDelete}: UpdateReminderModalProps) => {
    const {tokens} = useTheme();
    const {t} = useI18next();

    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    async function remove() {
        setError('');
        setDeleting(true);
        try {
            await Endpoints.remove(endpoint);
            onDelete();
            close();
        } catch (e: unknown) {
            handleError(e, setError, t);
        } finally {
            setDeleting(false);
        }
    }

    return <Modal>
        <Flex className="modal-content" direction="column">
            <Heading level={4}>{t('delete.modal.heading')}</Heading>
            <Divider/>
            <Text fontSize="large">{t('delete.modal.content')}</Text>
            {!!error &&
                <Alert variation="error" isDismissible={true} hasIcon={true} heading={t('serverErrors.heading')}>
                    {error}
                </Alert>}
            <ButtonGroup className="modal-buttons">
                <Button isLoading={deleting}
                        onClick={remove}
                        backgroundColor={tokens.colors.background.error}>
                    <Icon ariaLabel="Delete"
                          as={MdDelete}/> {t('button.delete')}
                </Button>
                <Button onClick={close} disabled={deleting}>
                    <Icon ariaLabel="Cancel"
                          as={MdCancel}/> {t('button.cancel')}
                </Button>
            </ButtonGroup>
        </Flex>
    </Modal>;
}