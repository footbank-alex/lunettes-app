import * as React from "react"
import {useState} from "react"
import {Alert, Button, ButtonGroup, Divider, Flex, Heading, Icon, Text, useTheme, View} from "@aws-amplify/ui-react";
import {MdCancel, MdSave} from "react-icons/md";
import {DateTime} from "luxon";
import Modal from "../Modal";
import DateTimePicker from "react-datetime-picker";
import {Endpoint, Endpoints} from "../../api/endpoint";
import {useI18next} from "gatsby-plugin-react-i18next";
import {handleError} from "../../api/utils";

interface UpdateReminderModalProps {
    endpoint: Endpoint;
    close: () => void;
    onUpdate: () => void;
}

export default ({endpoint, close, onUpdate}: UpdateReminderModalProps) => {
    const {tokens} = useTheme();
    const {t, language} = useI18next();

    const [newDateTime, setNewDateTime] = useState(endpoint.dateTime.toJSDate());
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');

    async function update() {
        setError('');
        setUpdating(true);
        try {
            await Endpoints.update(endpoint, DateTime.fromJSDate(newDateTime));
            onUpdate();
            close();
        } catch (e: unknown) {
            handleError(e, setError, t);
        } finally {
            setUpdating(false);
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

    return <Modal>
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
            {!!error &&
                <Alert variation="error" isDismissible={true} hasIcon={true} heading={t('serverErrors.heading')}>
                    {error}
                </Alert>}
            <ButtonGroup className="modal-buttons">
                <Button isLoading={updating}
                        disabled={!!dateTimeError()}
                        onClick={update}
                        backgroundColor={tokens.colors.background.info}>
                    <Icon ariaLabel="Save"
                          as={MdSave}/> {t('button.save')}
                </Button>
                <Button onClick={close} disabled={updating}>
                    <Icon ariaLabel="Cancel"
                          as={MdCancel}/> {t('button.cancel')}
                </Button>
            </ButtonGroup>
        </Flex>
    </Modal>;
}