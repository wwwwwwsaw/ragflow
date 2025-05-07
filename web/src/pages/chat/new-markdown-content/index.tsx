import Image from '@/components/image';
import SvgIcon from '@/components/svg-icon';
import { IReference, IReferenceChunk } from '@/interfaces/database/chat';
import { getExtension } from '@/utils/document-util';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Image as AntdImage, Button, Flex, Popover, Space } from 'antd';
import DOMPurify from 'dompurify';
import { useCallback, useEffect, useMemo } from 'react';
import Markdown from 'react-markdown';
import reactStringReplace from 'react-string-replace';
import SyntaxHighlighter from 'react-syntax-highlighter';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { visitParents } from 'unist-util-visit-parents';

import { useFetchDocumentThumbnailsByIds } from '@/hooks/document-hooks';
import { useTranslation } from 'react-i18next';

import 'katex/dist/katex.min.css'; // `rehype-katex` does not import the CSS for you

import { preprocessLaTeX } from '@/utils/chat';
import { replaceTextByOldReg } from '../utils';

import { api_host } from '@/utils/api';
import React from 'react';
import styles from './index.less';

const reg = /(~{2}\d+={2})/g;
const curReg = /(~{2}\d+\${2})/g;

const getChunkIndex = (match: string) => Number(match.slice(2, -2));
// 添加错误边界组件（Error Boundary）
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div>渲染失败，请联系管理员</div>;
    }
    return this.props.children;
  }
}

// TODO: The display of the table is inconsistent with the display previously placed in the MessageItem.
const NewMarkdownContent = ({
  isAssistant,
  reference,
  clickDocumentButton,
  content,
  loading,
}: {
  isAssistant: boolean;
  content: string;
  loading: boolean;
  reference: IReference;
  clickDocumentButton?: (documentId: string, chunk: IReferenceChunk) => void;
}) => {
  const { t } = useTranslation();
  const { setDocumentIds, data: fileThumbnails } =
    useFetchDocumentThumbnailsByIds();
  const contentWithCursor = useMemo(() => {
    let text = content;
    if (text === '') {
      text = t('chat.searching');
    }
    const nextText = replaceTextByOldReg(text);
    console.log('contentWithCursor', nextText);
    return loading ? nextText?.concat('~~2$$') : preprocessLaTeX(nextText);
  }, [content, loading, t]);

  useEffect(() => {
    const docAggs = reference?.doc_aggs;
    setDocumentIds(Array.isArray(docAggs) ? docAggs.map((x) => x.doc_id) : []);
  }, [reference, setDocumentIds]);

  const handleDocumentButtonClick = useCallback(
    (documentId: string, chunk: IReferenceChunk, isPdf: boolean) => () => {
      if (!isPdf) {
        return;
      }
      clickDocumentButton?.(documentId, chunk);
    },
    [clickDocumentButton],
  );

  const rehypeWrapReference = () => {
    return function wrapTextTransform(tree: any) {
      visitParents(tree, 'text', (node, ancestors) => {
        const latestAncestor = ancestors.at(-1);
        if (
          latestAncestor.tagName !== 'custom-typography' &&
          latestAncestor.tagName !== 'code'
        ) {
          node.type = 'element';
          node.tagName = 'custom-typography';
          node.properties = {};
          node.children = [{ type: 'text', value: node.value }];
        }
      });
    };
  };

  const PopoverMarkdownControl = (props: {
    content: string;
    documentId: string;
  }) => {
    // 安全转义HTML
    const content = DOMPurify.sanitize(props.content);
    return (
      <div className={styles.chunkContentText}>
        <ErrorBoundary>
          <Markdown
            rehypePlugins={[
              rehypeKatex,
              [rehypeRaw, { passThrough: ['element'] }],
            ]}
            remarkPlugins={[remarkGfm, remarkMath]}
            components={
              {
                // 'del': ({ node, children, ...props }: { children: string }) => {
                //   // node.children[0].value 包含了被 ~~ 包裹的文本
                //   // 我们直接将它用 ~~ 包裹后作为普通文本返回
                //   // 注意：这里假设内容是简单的文本。如果内部还有其他 Markdown，可能需要更复杂的处理。
                //   // 但对于你的场景（~ 是标识符），这通常足够了。
                //   // GFM 标准是双波浪线 ~~, 如果你的源文本是单波浪线 ~, 你可能需要调整这里的逻辑
                //   // 或确认是哪个插件处理了单波浪线。我们先按 GFM 标准处理 ~~。
                //   const originalText = children;
                //   return <span {...props}>~~{originalText}~~</span>; // 输出被双波浪线包裹的普通文本
                //   // 如果你的原始文本就是单波浪线 `~text~` 并且也被转换了，
                //   // 你可能需要改成 return <span {...props}>~{originalText}~</span>;
                //   // 或者更好的方式是根本不让它解析成 del，见方法一。
                // },
              }
            }
          >
            {content}
          </Markdown>
        </ErrorBoundary>
      </div>
    );
  };

  const getPopoverContent = useCallback(
    (chunkIndex: number) => {
      const chunks = reference?.chunks ?? [];
      const chunkItem = chunks[chunkIndex];
      const document = reference?.doc_aggs?.find(
        (x) => x?.doc_id === chunkItem?.document_id,
      );
      const documentId = document?.doc_id;
      const fileThumbnail = documentId ? fileThumbnails[documentId] : '';
      const fileExtension = documentId ? getExtension(document?.doc_name) : '';
      const imageId = chunkItem?.image_id;
      return (
        <Flex
          key={chunkItem?.id}
          gap={10}
          className={styles.referencePopoverWrapper}
        >
          {imageId && (
            <Popover
              placement="left"
              content={
                <Image
                  id={imageId}
                  className={styles.referenceImagePreview}
                ></Image>
              }
            >
              <Image
                id={imageId}
                className={styles.referenceChunkImage}
              ></Image>
            </Popover>
          )}
          <Space direction={'vertical'}>
            {/* 内部的 */}
            {/* <div
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(chunkItem?.content ?? ''),
              }}
              className={styles.chunkContentText}
            ></div> */}
            <PopoverMarkdownControl content={chunkItem?.content ?? ''} />
            {documentId && (
              <Flex gap={'small'}>
                {fileThumbnail ? (
                  <img
                    src={fileThumbnail}
                    alt=""
                    className={styles.fileThumbnail}
                  />
                ) : (
                  <SvgIcon
                    name={`file-icon/${fileExtension}`}
                    width={24}
                  ></SvgIcon>
                )}
                <Button
                  type="link"
                  className={styles.documentLink}
                  onClick={handleDocumentButtonClick(
                    documentId,
                    chunkItem,
                    fileExtension === 'pdf',
                  )}
                >
                  {document?.doc_name}
                </Button>
              </Flex>
            )}
          </Space>
        </Flex>
      );
    },
    [
      reference?.chunks,
      reference?.doc_aggs,
      fileThumbnails,
      handleDocumentButtonClick,
    ],
  );

  const renderReference = useCallback(
    (text: string) => {
      let replacedText = reactStringReplace(text, reg, (match, i) => {
        const chunkIndex = getChunkIndex(match);
        return (
          <Popover content={getPopoverContent(chunkIndex)} key={i}>
            <InfoCircleOutlined className={styles.referenceIcon} />
          </Popover>
        );
      });

      replacedText = reactStringReplace(replacedText, curReg, (match, i) => (
        <span className={styles.cursor} key={i}></span>
      ));

      return replacedText;
    },
    [getPopoverContent],
  );

  const MarkdownControl = (props: { content: string }) => {
    // console.log(props.content)
    return (
      <Markdown
        rehypePlugins={[rehypeWrapReference, rehypeKatex, rehypeRaw]}
        remarkPlugins={[remarkGfm, remarkMath]}
        components={
          {
            // 常规
            'custom-typography': ({ children }: { children: string }) =>
              renderReference(children),
            // 'del': ({ node, children, ...props }: { children: string }) => {
            //   // node.children[0].value 包含了被 ~~ 包裹的文本
            //   // 我们直接将它用 ~~ 包裹后作为普通文本返回
            //   // 注意：这里假设内容是简单的文本。如果内部还有其他 Markdown，可能需要更复杂的处理。
            //   // 但对于你的场景（~ 是标识符），这通常足够了。
            //   // GFM 标准是双波浪线 ~~, 如果你的源文本是单波浪线 ~, 你可能需要调整这里的逻辑
            //   // 或确认是哪个插件处理了单波浪线。我们先按 GFM 标准处理 ~~。
            //   const originalText = children;
            //   return <span {...props}>~~{originalText}~~</span>; // 输出被双波浪线包裹的普通文本
            //   // 如果你的原始文本就是单波浪线 `~text~` 并且也被转换了，
            //   // 你可能需要改成 return <span {...props}>~{originalText}~</span>;
            //   // 或者更好的方式是根本不让它解析成 del，见方法一。
            // },
            code(props: any) {
              const { children, className, node, ...rest } = props;
              // 动态选择对应的语法高亮器（如 javascript、python）。如果未指定语言或格式不匹配，则使用默认的 <code> 标签渲染。
              // const match = /language-(\w+)/.exec(className || '');
              const match = /language-([\w-]+)/.exec(className || '');
              return match ? (
                // 代码块
                <SyntaxHighlighter {...rest} PreTag="div" language={match[1]}>
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                // 普通代码块
                <code {...rest} className={className}>
                  {children}
                </code>
              );
            },
          } as any
        }
      >
        {props.content}
      </Markdown>
    );
  };
  const ImageListControl = () => {
    const chunks = reference?.chunks ?? [];
    const imageIds = chunks
      .filter((x) => x.image_id)
      .map((chunkItem) => chunkItem?.image_id);

    return (
      <div>
        <AntdImage.PreviewGroup>
          {/* {imageIds.map((imageId) => <AntdImage key={imageId} id={imageId} className={styles.referenceChunkImage}></AntdImage>)} */}
          {imageIds.map((id) => (
            <AntdImage
              height={200}
              width={200}
              key={id}
              src={`${api_host}/document/image/${id}`}
              id={`${api_host}/document/image/${id}`}
              className={styles.referenceChunkImage}
            ></AntdImage>
          ))}
        </AntdImage.PreviewGroup>
      </div>
    );
  };
  return (
    <Flex vertical>
      <MarkdownControl content={contentWithCursor} />
      <div hidden={!isAssistant}>
        <ImageListControl></ImageListControl>
      </div>
    </Flex>
  );
  // return (
  //   <Markdown
  //     rehypePlugins={[rehypeWrapReference, rehypeKatex, rehypeRaw]}
  //     remarkPlugins={[remarkGfm, remarkMath]}
  //     components={
  //       {
  //         // 常规
  //         'custom-typography': ({ children }: { children: string }) =>
  //           renderReference(children),
  //         'del': ({ node, children, ...props }: { children: string }) => {
  //           // node.children[0].value 包含了被 ~~ 包裹的文本
  //           // 我们直接将它用 ~~ 包裹后作为普通文本返回
  //           // 注意：这里假设内容是简单的文本。如果内部还有其他 Markdown，可能需要更复杂的处理。
  //           // 但对于你的场景（~ 是标识符），这通常足够了。
  //           // GFM 标准是双波浪线 ~~, 如果你的源文本是单波浪线 ~, 你可能需要调整这里的逻辑
  //           // 或确认是哪个插件处理了单波浪线。我们先按 GFM 标准处理 ~~。
  //           const originalText = children;
  //           return <span {...props}>~~{originalText}~~</span>; // 输出被双波浪线包裹的普通文本
  //           // 如果你的原始文本就是单波浪线 `~text~` 并且也被转换了，
  //           // 你可能需要改成 return <span {...props}>~{originalText}~</span>;
  //           // 或者更好的方式是根本不让它解析成 del，见方法一。
  //         },
  //         code(props: any) {
  //           const { children, className, node, ...rest } = props;
  //           // 动态选择对应的语法高亮器（如 javascript、python）。如果未指定语言或格式不匹配，则使用默认的 <code> 标签渲染。
  //           // const match = /language-(\w+)/.exec(className || '');
  //           const match = /language-([\w-]+)/.exec(className || '');
  //           return match ? (
  //             // 代码块
  //             <SyntaxHighlighter {...rest} PreTag="div" language={match[1]}>
  //               {String(children).replace(/\n$/, '')}
  //             </SyntaxHighlighter>
  //           ) : (
  //             // 普通代码块
  //             <code {...rest} className={className}>
  //               {children}
  //             </code>
  //           );
  //         },
  //       } as any
  //     }
  //   >
  //     {contentWithCursor}
  //   </Markdown>
  // );
};

export default NewMarkdownContent;
