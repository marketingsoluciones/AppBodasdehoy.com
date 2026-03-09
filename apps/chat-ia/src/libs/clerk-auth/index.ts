// Dynamic import to avoid Turbopack issues with @clerk/nextjs/server
import type { NextRequest } from 'next/server';

// Lazy load Clerk server functions
let clerkServer: typeof import('@clerk/nextjs/server') | null = null;

const getClerkServer = async () => {
  if (!clerkServer) {
    clerkServer = await import('@clerk/nextjs/server');
  }
  return clerkServer;
};

export class ClerkAuth {
  private devUserId: string | null = null;
  private prodUserId: string | null = null;

  constructor() {
    this.parseUserIdMapping();
  }

  /**
   * 从请求中获取认证信息和用户ID
   */
  async getAuthFromRequest(request: NextRequest) {
    const clerk = await getClerkServer();
    const clerkAuth = clerk.getAuth(request);
    const userId = this.getMappedUserId(clerkAuth.userId);

    return { clerkAuth, userId };
  }

  /**
   * 获取当前认证信息和用户ID
   */
  async getAuth() {
    const clerk = await getClerkServer();
    const clerkAuth = await clerk.auth();
    const userId = this.getMappedUserId(clerkAuth.userId);

    return { clerkAuth, userId };
  }

  async getCurrentUser() {
    const clerk = await getClerkServer();
    const user = await clerk.currentUser();

    if (!user) return null;

    const userId = this.getMappedUserId(user.id) as string;

    return { ...user, id: userId };
  }

  /**
   * 根据环境变量映射用户ID
   */
  private getMappedUserId(originalUserId: string | null): string | null {
    if (!originalUserId) return null;

    // 只在开发环境下执行映射
    if (
      process.env.NODE_ENV === 'development' &&
      this.devUserId &&
      this.prodUserId &&
      originalUserId === this.devUserId
    ) {
      return this.prodUserId;
    }

    return originalUserId;
  }

  /**
   * 解析环境变量中的用户ID映射配置
   * 格式: "dev=prod"
   */
  private parseUserIdMapping(): void {
    const mappingStr = process.env.CLERK_DEV_IMPERSONATE_USER || '';

    if (!mappingStr) return;

    const [dev, prod] = mappingStr.split('=');
    if (dev && prod) {
      this.devUserId = dev.trim();
      this.prodUserId = prod.trim();
    }
  }
}

// Type for ClerkAuth result
export type IClerkAuth = ReturnType<Awaited<ReturnType<typeof getClerkServer>>['getAuth']>;

export const clerkAuth = new ClerkAuth();
