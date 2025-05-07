import png from '@/assets/new/立即分析.png';
import { useTranslate } from '@/hooks/common-hooks';
import { useSendButtonDisabled } from '@/pages/chat/hooks';
import { Button, Flex, Input, Space } from 'antd';
import classNames from 'classnames';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import styles from './index.less';

interface IProps {
  disabled: boolean;
  sendLoading: boolean;
  onPressEnter(value: string): void;
  conversationId: string;
  buttonIcon: string | undefined;
}

// 复杂样式的输入框
const MessageInput = ({
  disabled,
  onPressEnter,
  sendLoading,
  conversationId,
  buttonIcon = undefined,
}: IProps) => {
  const { t } = useTranslate('chat');
  const conversationIdRef = useRef(conversationId);
  const [value, setInputValue] = useState(''); // 初始化状态

  const handlePressEnter = useCallback(async () => {
    if (value === '') return;
    // const ids = getFileIds(fileList.filter((x) => isUploadSuccess(x)));
    onPressEnter(value);
    setInputValue('');
  }, [onPressEnter, value]);
  const isFinished = useSendButtonDisabled(value);
  useEffect(() => {
    if (
      conversationIdRef.current &&
      conversationId !== conversationIdRef.current
    ) {
    }
    conversationIdRef.current = conversationId;
  }, [conversationId]);
  const localPNG = buttonIcon ?? png;
  return (
    <Flex
      gap={10}
      align="center"
      vertical
      className={styles.messageInputWrapper}
    >
      {/* border-image 会覆盖 border-radius，这是浏览器默认行为。 */}
      <div
        style={{ position: 'relative', display: 'inline-block', width: '100%' }}
      >
        <Input
          style={{
            position: 'relative',
            zIndex: 1,
            backgroundColor: '#fff',
            borderRadius: '4px',
            border: 'none', // 必须移除默认边框

            alignItems: 'flex-start', // 顶部对齐
            paddingTop: '8px', // 调整文本位置
            // border: '2px solid transparent',
            // borderImage: 'linear-gradient(to left bottom, #ff4d4f, #1890ff) 1',
            // backgroundClip: 'padding-box', // 防止背景色溢出到边框区域
            // backgroundColor: '#ffffff', // 设置背景色（否则会透明）
            // border: 'none',
            // boxShadow: '0 0 0 2px #ff4d4f, 0 0 0 4px #1890ff',
          }}
          onPressEnter={handlePressEnter}
          size="large"
          placeholder="请输入想提问的问题"
          value={value}
          disabled={disabled}
          className={classNames(styles.inputWrapper)}
          suffix={
            <Space align="baseline">
              <Button
                style={{
                  width: '100px',
                  height: '20px',
                  backgroundColor: 'transparent',
                  border: 'none',
                }}
                icon={<img src={localPNG}></img>}
                type="primary"
                onClick={handlePressEnter}
                loading={sendLoading}
                disabled={isFinished}
              ></Button>
            </Space>
          }
          onChange={(e) => setInputValue(e.target.value)}
        />
        <div
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            bottom: '-2px',
            left: '-2px',
            background: 'linear-gradient(to left bottom, #4b79fa, #2edff4)',
            borderRadius: '6px', // 4px + 2px边框
            zIndex: 0,
            padding: '2px',
          }}
        />
      </div>
    </Flex>
  );
};

export default memo(MessageInput);
