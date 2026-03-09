import { LatexTextSplitter } from '@langchain/textsplitters';

import { loaderConfig } from '../config';

export const LatexLoader = async (text: string) => {
  const splitter = new LatexTextSplitter(loaderConfig);

  return await splitter.createDocuments([text]);
};
