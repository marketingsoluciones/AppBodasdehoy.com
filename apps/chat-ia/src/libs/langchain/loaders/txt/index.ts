import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

import { loaderConfig } from '../config';

export const TextLoader = async (text: string) => {
  const splitter = new RecursiveCharacterTextSplitter(loaderConfig);

  return await splitter.createDocuments([text]);
};
