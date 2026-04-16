import { LobeChatDatabase } from '@lobechat/database';

import {
  DEFAULT_OPENING_MESSAGE,
  DEFAULT_OPENING_QUESTIONS,
  getOpeningMessageForDevelopment,
  getOpeningQuestionsForDevelopment,
} from '@/const/agents/defaultCopilotSystemRole';
import { SessionModel } from '@/database/models/session';
import { getServerDefaultAgentConfig } from '@/server/globalConfig';

export class AgentService {
  private readonly userId: string;
  private readonly db: LobeChatDatabase;

  constructor(db: LobeChatDatabase, userId: string) {
    this.userId = userId;
    this.db = db;
  }

  async createInbox() {
    const sessionModel = new SessionModel(this.db, this.userId);
    const defaultAgentConfig = getServerDefaultAgentConfig();

    // Inyectar opening message y questions según developer (bodas vs CRM genérico)
    const dev = process.env.NEXT_PUBLIC_DEVELOPMENT;
    if (!defaultAgentConfig.openingMessage) {
      defaultAgentConfig.openingMessage = getOpeningMessageForDevelopment(dev);
    }
    if (!defaultAgentConfig.openingQuestions || defaultAgentConfig.openingQuestions.length === 0) {
      defaultAgentConfig.openingQuestions = getOpeningQuestionsForDevelopment(dev);
    }

    await sessionModel.createInbox(defaultAgentConfig);
  }
}
