import { ReactComponent as AssistantIcon } from '@/assets/svg/assistant.svg';
import { MessageType } from '@/constants/chat';
import { useSetModalState } from '@/hooks/common-hooks';
import {
  Docagg,
  IReference,
  IReferenceChunk,
} from '@/interfaces/database/chat';
import { DownloadOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useTranslate } from '@/hooks/common-hooks';
import {
  useFetchDocumentInfosByIds,
  useFetchDocumentThumbnailsByIds,
} from '@/hooks/document-hooks';
import { IRegenerateMessage, IRemoveMessageById } from '@/hooks/logic-hooks';
import { IMessage } from '@/pages/chat/interface';
import NewMarkdownContent from '@/pages/chat/new-markdown-content';
import { getExtension, isImage } from '@/utils/document-util';
import { downloadDocument } from '@/utils/file-util';
import {
  Avatar,
  Button,
  Card,
  Checkbox,
  Flex,
  List,
  Space,
  Typography,
} from 'antd';
import FileIcon from '../file-icon';
import IndentedTreeModal from '../indented-tree/modal';
import NewDocumentLink from '../new-document-link';
import { useTheme } from '../theme-provider';
import { AssistantGroupButton, UserGroupButton } from './group-button';
import styles from './index.less';
// import { ReactComponent as DownloadIcon } from '@/assets/new/download2.png';

const { Text } = Typography;

interface IProps extends Partial<IRemoveMessageById>, IRegenerateMessage {
  item: IMessage;
  reference: IReference;
  loading?: boolean;
  sendLoading?: boolean;
  nickname?: string;
  avatar?: string;
  avatardialog?: string | null;
  clickDocumentButton?: (documentId: string, chunk: IReferenceChunk) => void;
  index: number;
  showLikeButton?: boolean;
  showLoudspeaker?: boolean;
}

const ReferenceItem = memo(
  ({
    item,
    onCheck,
  }: {
    item: Docagg;
    onCheck: (id: string, checked: boolean) => void;
  }) => {
    const { t } = useTranslate('chat');
    const onDownloadDocument = () => {
      downloadDocument({
        id: item.doc_id,
        filename: item.doc_name,
      });
    };
    return (
      <List.Item
        style={{
          width: '100%',
          padding: '0 10px 0 0',
          border: 'none',
          margin: '5px',
        }}
      >
        <Flex
          justify="space-between"
          align="center"
          style={{
            width: '100%',
            border: '1px solid #f5f5f5',
            borderRadius: '5px',
          }}
          gap={0}
        >
          <Flex gap={'small'}>
            <Checkbox
              onChange={(e) => onCheck(item.doc_id, e.target.checked)}
              checked={!!item.checked}
              style={{
                display: 'flex',
                backgroundColor: '#f6f7fb',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
              }}
            />
            <Flex vertical align="left" style={{ margin: '10px 0 5px 0' }}>
              <Flex gap={'small'} align="center">
                <FileIcon id={item.doc_id} name={item.doc_name}></FileIcon>
                <NewDocumentLink
                  documentId={item.doc_id}
                  documentName={item.doc_name}
                  prefix="document"
                >
                  {item.doc_name}
                </NewDocumentLink>
              </Flex>
              <Text style={{ color: '#c7cfd9', margin: '0,10px' }}>
                编号：{item.doc_id}
              </Text>
            </Flex>
          </Flex>
          <Button
            style={{ margin: '0 15px 0 0' }}
            icon={<DownloadOutlined />}
            type="primary"
            onClick={onDownloadDocument}
          >
            {t('download')}
          </Button>
        </Flex>
      </List.Item>
    );
  },
);

const NewMessageItem = ({
  item,
  reference,
  loading = false,
  avatar,
  avatardialog,
  sendLoading = false,
  clickDocumentButton,
  index,
  removeMessageById,
  regenerateMessage,
  showLikeButton = true,
  showLoudspeaker = true,
}: IProps) => {
  const { theme } = useTheme();
  const isAssistant = item.role === MessageType.Assistant;
  const isUser = item.role === MessageType.User;
  const { data: documentList, setDocumentIds } = useFetchDocumentInfosByIds();
  const { data: documentThumbnails, setDocumentIds: setIds } =
    useFetchDocumentThumbnailsByIds();
  const { visible, hideModal, showModal } = useSetModalState();
  const [clickedDocumentId, setClickedDocumentId] = useState('');

  // 新增状态管理选中文件
  const [checkedDocuments, setCheckedDocuments] = useState<
    Record<string, boolean>
  >({});
  const referenceDocumentList = useMemo(() => {
    return reference?.doc_aggs ?? [];
  }, [reference?.doc_aggs]);

  const handleUserDocumentClick = useCallback(
    (id: string) => () => {
      setClickedDocumentId(id);
      showModal();
    },
    [showModal],
  );

  const handleRegenerateMessage = useCallback(() => {
    regenerateMessage?.(item);
  }, [regenerateMessage, item]);

  useEffect(() => {
    const ids = item?.doc_ids ?? [];
    if (ids.length) {
      setDocumentIds(ids);
      const documentIds = ids.filter((x) => !(x in documentThumbnails));
      if (documentIds.length) {
        setIds(documentIds);
      }
    }
  }, [item.doc_ids, setDocumentIds, setIds, documentThumbnails]);

  const { t } = useTranslate('chat');
  // const { t } = useTranslate();
  const handleDocumentCheck = useCallback((docId: string, checked: boolean) => {
    setCheckedDocuments((prev) => ({
      ...prev,
      [docId]: checked,
    }));
  }, []);
  const hasCheckedDocuments = referenceDocumentList.some(
    (item) => checkedDocuments[item.doc_id],
  );

  const onDownloadAllDocument = () => {
    const selectedDocs = referenceDocumentList.filter(
      (item) => checkedDocuments[item.doc_id],
    );
    if (selectedDocs.length === 0) return;
    selectedDocs.forEach((item) =>
      downloadDocument({
        id: item.doc_id,
        filename: item.doc_name,
      }),
    );
  };
  return (
    <div
      className={classNames(styles.messageItem, {
        [styles.messageItemLeft]: item.role === MessageType.Assistant,
        [styles.messageItemRight]: item.role === MessageType.User,
      })}
    >
      <section
        className={classNames(styles.messageItemSection, {
          [styles.messageItemSectionLeft]: item.role === MessageType.Assistant,
          [styles.messageItemSectionRight]: item.role === MessageType.User,
        })}
      >
        <div
          className={classNames(styles.messageItemContent, {
            [styles.messageItemContentReverse]: item.role === MessageType.User,
          })}
        >
          {item.role === MessageType.User ? (
            <Avatar size={40} src={avatar ?? '/logo.png'} />
          ) : avatardialog ? (
            <Avatar size={40} src={avatardialog} />
          ) : (
            <AssistantIcon />
          )}
          <Flex vertical gap={8} flex={1}>
            <Space>
              {isAssistant ? (
                index !== 0 && (
                  <AssistantGroupButton
                    messageId={item.id}
                    content={item.content}
                    prompt={item.prompt}
                    showLikeButton={showLikeButton}
                    audioBinary={item.audio_binary}
                    showLoudspeaker={showLoudspeaker}
                  ></AssistantGroupButton>
                )
              ) : (
                <UserGroupButton
                  content={item.content}
                  messageId={item.id}
                  removeMessageById={removeMessageById}
                  regenerateMessage={
                    regenerateMessage && handleRegenerateMessage
                  }
                  sendLoading={sendLoading}
                ></UserGroupButton>
              )}

              {/* <b>{isAssistant ? '' : nickname}</b> */}
            </Space>
            <div
              className={
                isAssistant
                  ? theme === 'dark'
                    ? styles.messageTextDark
                    : styles.messageText
                  : styles.messageUserText
              }
            >
              <NewMarkdownContent
                isAssistant={isAssistant}
                loading={loading}
                content={item.content}
                reference={reference}
                clickDocumentButton={clickDocumentButton}
              ></NewMarkdownContent>
            </div>
            {isAssistant && referenceDocumentList.length > 0 && (
              <Card>
                <Flex vertical>
                  <Flex gap={0} justify="space-between">
                    <Text>{t('reference_documents')}</Text>
                    <Button
                      type="link"
                      onClick={onDownloadAllDocument}
                      disabled={!hasCheckedDocuments}
                    >
                      {t('downloadAll')}
                    </Button>
                  </Flex>
                  <List
                    // 'solid', borderColor: '#f5f5f5'
                    dataSource={referenceDocumentList}
                    renderItem={(item) => (
                      <ReferenceItem
                        item={{
                          ...item,
                          checked: checkedDocuments[item.doc_id] || false,
                        }}
                        onCheck={handleDocumentCheck}
                      />
                    )}
                  />
                </Flex>
              </Card>
            )}
            {isUser && documentList.length > 0 && (
              <List
                bordered
                dataSource={documentList}
                renderItem={(item) => {
                  // TODO:
                  // const fileThumbnail =
                  //   documentThumbnails[item.id] || documentThumbnails[item.id];
                  const fileExtension = getExtension(item.name);
                  return (
                    <List.Item>
                      <Flex gap={'small'} align="center">
                        <FileIcon id={item.id} name={item.name}></FileIcon>

                        {isImage(fileExtension) ? (
                          <NewDocumentLink
                            documentId={item.id}
                            documentName={item.name}
                            prefix="document"
                          >
                            {item.name}
                          </NewDocumentLink>
                        ) : (
                          <Button
                            type={'text'}
                            onClick={handleUserDocumentClick(item.id)}
                          >
                            <Text
                              style={{ maxWidth: '40vw' }}
                              ellipsis={{ tooltip: item.name }}
                            >
                              {item.name}
                            </Text>
                          </Button>
                        )}
                      </Flex>
                    </List.Item>
                  );
                }}
              />
            )}
          </Flex>
        </div>
      </section>
      {visible && (
        <IndentedTreeModal
          visible={visible}
          hideModal={hideModal}
          documentId={clickedDocumentId}
        ></IndentedTreeModal>
      )}
    </div>
  );
};

export default memo(NewMessageItem);
