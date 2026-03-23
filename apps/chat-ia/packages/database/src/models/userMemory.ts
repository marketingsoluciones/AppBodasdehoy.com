import { and, cosineDistance, desc, eq, sql } from 'drizzle-orm';

import {
  NewUserMemory,
  NewUserMemoryPreference,
  UserMemoryItem,
  UserMemoryPreference,
  userMemories,
  userMemoriesIdentities,
  userMemoriesPreferences,
} from '../schemas';
import { LobeChatDatabase } from '../type';

export class UserMemoryModel {
  private userId: string;
  private db: LobeChatDatabase;

  constructor(db: LobeChatDatabase, userId: string) {
    this.userId = userId;
    this.db = db;
  }

  // ==================== READ ====================

  /**
   * Busca memorias relevantes usando similitud coseno contra summary_vector_1024.
   */
  findRelevantMemories = async (
    queryEmbedding: number[],
    limit: number = 5,
    minScore: number = 0.3,
  ) => {
    const similarity = sql<number>`1 - (${cosineDistance(
      userMemories.summaryVector1024,
      queryEmbedding,
    )})`;

    return this.db
      .select({
        details: userMemories.details,
        id: userMemories.id,
        memoryCategory: userMemories.memoryCategory,
        memoryType: userMemories.memoryType,
        similarity,
        summary: userMemories.summary,
        tags: userMemories.tags,
        title: userMemories.title,
      })
      .from(userMemories)
      .where(
        and(
          eq(userMemories.userId, this.userId),
          sql`${similarity} > ${minScore}`,
        ),
      )
      .orderBy(desc(similarity))
      .limit(limit);
  };

  /**
   * Busca preferencias del usuario usando similitud coseno contra conclusion_directives_vector.
   */
  findRelevantPreferences = async (
    queryEmbedding: number[],
    limit: number = 5,
    minScore: number = 0.3,
  ) => {
    const similarity = sql<number>`1 - (${cosineDistance(
      userMemoriesPreferences.conclusionDirectivesVector,
      queryEmbedding,
    )})`;

    return this.db
      .select({
        conclusionDirectives: userMemoriesPreferences.conclusionDirectives,
        id: userMemoriesPreferences.id,
        similarity,
        suggestions: userMemoriesPreferences.suggestions,
        tags: userMemoriesPreferences.tags,
        type: userMemoriesPreferences.type,
      })
      .from(userMemoriesPreferences)
      .where(
        and(
          eq(userMemoriesPreferences.userId, this.userId),
          sql`${similarity} > ${minScore}`,
        ),
      )
      .orderBy(desc(similarity))
      .limit(limit);
  };

  /**
   * Busca datos de identidad del usuario.
   */
  findUserIdentity = async (
    queryEmbedding: number[],
    limit: number = 3,
    minScore: number = 0.3,
  ) => {
    const similarity = sql<number>`1 - (${cosineDistance(
      userMemoriesIdentities.descriptionVector,
      queryEmbedding,
    )})`;

    return this.db
      .select({
        description: userMemoriesIdentities.description,
        id: userMemoriesIdentities.id,
        relationship: userMemoriesIdentities.relationship,
        role: userMemoriesIdentities.role,
        similarity,
        type: userMemoriesIdentities.type,
      })
      .from(userMemoriesIdentities)
      .where(
        and(
          eq(userMemoriesIdentities.userId, this.userId),
          sql`${similarity} > ${minScore}`,
        ),
      )
      .orderBy(desc(similarity))
      .limit(limit);
  };

  // ==================== WRITE ====================

  create = async (params: Omit<NewUserMemory, 'userId'>) => {
    const [result] = await this.db
      .insert(userMemories)
      .values({ ...params, userId: this.userId })
      .returning();

    return result;
  };

  createPreference = async (params: Omit<NewUserMemoryPreference, 'userId'>) => {
    const [result] = await this.db
      .insert(userMemoriesPreferences)
      .values({ ...params, userId: this.userId })
      .returning();

    return result;
  };

  update = async (id: string, value: Partial<UserMemoryItem>) => {
    return this.db
      .update(userMemories)
      .set({ ...value, updatedAt: new Date() })
      .where(and(eq(userMemories.id, id), eq(userMemories.userId, this.userId)));
  };

  updatePreference = async (id: string, value: Partial<UserMemoryPreference>) => {
    return this.db
      .update(userMemoriesPreferences)
      .set({ ...value, updatedAt: new Date() })
      .where(
        and(
          eq(userMemoriesPreferences.id, id),
          eq(userMemoriesPreferences.userId, this.userId),
        ),
      );
  };

  /**
   * Actualiza lastAccessedAt y accessedCount de una memoria.
   */
  touchAccessed = async (id: string) => {
    return this.db
      .update(userMemories)
      .set({
        accessedCount: sql`${userMemories.accessedCount} + 1`,
        lastAccessedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(userMemories.id, id), eq(userMemories.userId, this.userId)));
  };
}
