import { MarkdownTextSplitter } from '@langchain/textsplitters';

import { loaderConfig } from '../config';

export const MarkdownLoader = async (text: string) => {
  const splitter = new MarkdownTextSplitter(loaderConfig);

  return await splitter.createDocuments([text]);
};
