import {
  RecursiveCharacterTextSplitter,
  SupportedTextSplitterLanguage,
} from '@langchain/textsplitters';

import { loaderConfig } from '@/libs/langchain/loaders/config';

export const CodeLoader = async (text: string, language: string) => {
  const splitter = RecursiveCharacterTextSplitter.fromLanguage(
    language as SupportedTextSplitterLanguage,
    loaderConfig,
  );

  return await splitter.createDocuments([text]);
};
