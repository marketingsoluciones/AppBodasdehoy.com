import { BRANDING_NAME } from '@lobechat/const/branding';

import { ModelProviderCard } from '@/types/llm';

const cloudName = `${BRANDING_NAME} Cloud`;

const LobeHub: ModelProviderCard = {
  chatModels: [],
  description: `${cloudName}: servicio en la nube con API gestionada y uso medido en créditos (tokens de los modelos).`,
  enabled: true,
  id: 'lobehub',
  modelsUrl: 'https://bodasdehoy.com',
  name: cloudName,
  settings: {
    modelEditable: false,
    showAddNewModel: false,
    showModelFetcher: false,
  },
  showConfig: false,
  url: 'https://bodasdehoy.com',
};

export default LobeHub;

export const planCardModels = ['gpt-4o-mini', 'deepseek-reasoner', 'claude-3-5-sonnet-latest'];
