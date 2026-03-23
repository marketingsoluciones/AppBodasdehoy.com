import { LobeChatDatabase } from '@lobechat/database';

import {
  DEFAULT_OPENING_MESSAGE,
  DEFAULT_OPENING_QUESTIONS,
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

    // Inyectar opening message y questions si no están definidos
    if (!defaultAgentConfig.openingMessage) {
      defaultAgentConfig.openingMessage = DEFAULT_OPENING_MESSAGE;
    }
    if (!defaultAgentConfig.openingQuestions || defaultAgentConfig.openingQuestions.length === 0) {
      defaultAgentConfig.openingQuestions = DEFAULT_OPENING_QUESTIONS;
    }

    await sessionModel.createInbox(defaultAgentConfig);
  }
}
