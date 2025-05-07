import NewChatContainer from './new-large';

import styles from './index.less';

const SharedDialogChat = () => {
  return (
    <div className={styles.chatWrapper}>
      <NewChatContainer></NewChatContainer>
    </div>
  );
};

export default SharedDialogChat;
