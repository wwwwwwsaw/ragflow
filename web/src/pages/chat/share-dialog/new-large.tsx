import NewMessageItem from '@/components/new-message-item';
import { useClickDrawer } from '@/components/pdf-drawer/hooks';
import { MessageType } from '@/constants/chat';
import { useSendButtonDisabled } from '@/pages/chat/hooks';
import { Flex, Spin } from 'antd';
import React, { forwardRef } from 'react';
import {
  useGetSharedChatSearchParams,
  useSendSharedMessage,
} from '../shared-hooks';
import { buildMessageItemReference } from '../utils';

import AnswerIcon from '@/assets/new/answer.png';
import QuestionIcon from '@/assets/new/question.png';
import sendIcon from '@/assets/new/send.png';
import PdfDrawer from '@/components/pdf-drawer';
import i18n from '@/locales/config';
import { buildMessageUuidWithRole } from '@/utils/chat';
import styles from './index.less';
import MessageInput from './message-input';
const NewChatContainer = () => {
  const {
    sharedId: conversationId,
    from,
    locale,
  } = useGetSharedChatSearchParams();
  const { visible, hideModal, documentId, selectedChunk, clickDocumentButton } =
    useClickDrawer();

  const {
    handleSendMsg,
    handlePressEnter,
    handleInputChange,
    value,
    sendLoading,
    loading,
    ref,
    derivedMessages,
    hasError,
  } = useSendSharedMessage();
  const sendDisabled = useSendButtonDisabled(value);
  React.useEffect(() => {
    if (locale && i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [locale]);
  if (!conversationId) {
    return <div>empty</div>;
  }

  return (
    <>
      <Flex flex={1} className={styles.chatContainer} vertical>
        <Flex flex={1} vertical className={styles.messageContainer}>
          <div>
            <Spin spinning={loading}>
              {derivedMessages?.map((message, i) => {
                return (
                  <NewMessageItem
                    key={buildMessageUuidWithRole(message)}
                    // avatardialog={avatarData?.avatar}
                    avatardialog={AnswerIcon}
                    avatar={QuestionIcon}
                    item={message}
                    nickname="You"
                    reference={buildMessageItemReference(
                      {
                        message: derivedMessages,
                        reference: [],
                      },
                      message,
                    )}
                    loading={
                      message.role === MessageType.Assistant &&
                      sendLoading &&
                      derivedMessages?.length - 1 === i
                    }
                    index={i}
                    clickDocumentButton={clickDocumentButton}
                    showLikeButton={false}
                    showLoudspeaker={false}
                  ></NewMessageItem>
                );
              })}
            </Spin>
          </div>
          <div ref={ref} />
        </Flex>
        <Flex className={styles.footSender} vertical>
          <MessageInput
            buttonIcon={sendIcon}
            disabled={hasError}
            conversationId={conversationId}
            onPressEnter={handleSendMsg}
            sendLoading={sendLoading}
          ></MessageInput>
        </Flex>
      </Flex>
      {visible && (
        <PdfDrawer
          visible={visible}
          hideModal={hideModal}
          documentId={documentId}
          chunk={selectedChunk}
        ></PdfDrawer>
      )}
    </>
  );
};

export default forwardRef(NewChatContainer);
