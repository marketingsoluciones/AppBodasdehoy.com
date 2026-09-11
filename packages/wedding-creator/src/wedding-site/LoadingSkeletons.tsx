'use client';

/**
 * Loading Skeletons
 * =================
 * Skeleton components para estados de carga
 */

import React from 'react';

// Skeleton base animation
const skeletonStyle = `
  @keyframes shimmer {
    0% { background-position: -200px 0; }
    100% { background-position: calc(200px + 100%) 0; }
  }

  .skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200px 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
  }
`;

export function ChatSkeleton() {
  return (
    <div className="chat-skeleton">
      <style jsx>{skeletonStyle}</style>
      <style jsx>{`
        .chat-skeleton {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: white;
        }

        .chat-header-skeleton {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .chat-messages-skeleton {
          flex: 1;
          padding: 1rem;
          overflow: hidden;
        }

        .message-skeleton {
          margin-bottom: 1rem;
        }

        .message-skeleton.user {
          display: flex;
          justify-content: flex-end;
        }

        .message-bubble-skeleton {
          padding: 0.75rem 1rem;
          border-radius: 1rem;
        }

        .chat-input-skeleton {
          padding: 1rem;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 0.5rem;
        }
      `}</style>

      {/* Header */}
      <div className="chat-header-skeleton">
        <div className="skeleton" style={{ borderRadius: '50%', height: '32px', width: '32px' }} />
        <div className="skeleton" style={{ height: '20px', width: '150px' }} />
      </div>

      {/* Messages */}
      <div className="chat-messages-skeleton">
        <div className="message-skeleton">
          <div className="skeleton message-bubble-skeleton" style={{ height: '60px', width: '70%' }} />
        </div>
        <div className="message-skeleton user">
          <div className="skeleton message-bubble-skeleton" style={{ height: '40px', width: '50%' }} />
        </div>
        <div className="message-skeleton">
          <div className="skeleton message-bubble-skeleton" style={{ height: '80px', width: '60%' }} />
        </div>
        <div className="message-skeleton user">
          <div className="skeleton message-bubble-skeleton" style={{ height: '40px', width: '40%' }} />
        </div>
      </div>

      {/* Input */}
      <div className="chat-input-skeleton">
        <div className="skeleton" style={{ borderRadius: '22px', flex: 1, height: '44px' }} />
        <div className="skeleton" style={{ borderRadius: '50%', height: '44px', width: '44px' }} />
      </div>
    </div>
  );
}

export function PreviewSkeleton() {
  return (
    <div className="preview-skeleton">
      <style jsx>{skeletonStyle}</style>
      <style jsx>{`
        .preview-skeleton {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #f3f4f6;
        }

        .preview-header-skeleton {
          padding: 0.75rem 1rem;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .preview-content-skeleton {
          flex: 1;
          padding: 1rem;
          display: flex;
          justify-content: center;
        }

        .preview-frame-skeleton {
          background: white;
          border-radius: 8px;
          width: 100%;
          max-width: 800px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .hero-skeleton {
          height: 300px;
          position: relative;
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        .section-skeleton {
          padding: 2rem 1rem;
        }

        .section-title-skeleton {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }
      `}</style>

      {/* Header */}
      <div className="preview-header-skeleton">
        <div className="skeleton" style={{ height: '20px', width: '100px' }} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="skeleton" style={{ borderRadius: '6px', height: '32px', width: '80px' }} />
          <div className="skeleton" style={{ borderRadius: '6px', height: '32px', width: '80px' }} />
        </div>
      </div>

      {/* Content */}
      <div className="preview-content-skeleton">
        <div className="preview-frame-skeleton">
          {/* Hero */}
          <div className="hero-skeleton skeleton">
            <div className="hero-overlay">
              <div className="skeleton" style={{ background: 'rgba(255,255,255,0.3)', height: '40px', width: '200px' }} />
              <div className="skeleton" style={{ background: 'rgba(255,255,255,0.3)', height: '24px', width: '150px' }} />
              <div className="skeleton" style={{ background: 'rgba(255,255,255,0.3)', height: '20px', width: '180px' }} />
            </div>
          </div>

          {/* Section 1 */}
          <div className="section-skeleton">
            <div className="section-title-skeleton">
              <div className="skeleton" style={{ height: '28px', width: '200px' }} />
              <div className="skeleton" style={{ height: '16px', width: '150px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="skeleton" style={{ height: '60px', width: '100%' }} />
              <div className="skeleton" style={{ height: '60px', width: '100%' }} />
              <div className="skeleton" style={{ height: '60px', width: '100%' }} />
            </div>
          </div>

          {/* Section 2 */}
          <div className="section-skeleton" style={{ background: '#f9fafb' }}>
            <div className="section-title-skeleton">
              <div className="skeleton" style={{ height: '28px', width: '180px' }} />
            </div>
            <div className="skeleton" style={{ borderRadius: '8px', height: '200px', width: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Section Skeleton - for individual section loading
 */
export function SectionSkeleton({ height = '200px' }: { height?: string }) {
  return (
    <div className="section-skeleton">
      <style jsx>{skeletonStyle}</style>
      <style jsx>{`
        .section-skeleton {
          padding: 2rem 1rem;
        }
        .section-title-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }
      `}</style>
      <div className="section-title-area">
        <div className="skeleton" style={{ height: '28px', width: '200px' }} />
        <div className="skeleton" style={{ height: '16px', width: '150px' }} />
      </div>
      <div className="skeleton" style={{ borderRadius: '8px', height, width: '100%' }} />
    </div>
  );
}

export function WeddingCreatorSkeleton() {
  return (
    <div className="wedding-creator-skeleton">
      <style jsx>{`
        .wedding-creator-skeleton {
          display: flex;
          height: 100vh;
        }

        .chat-panel {
          width: 400px;
          flex-shrink: 0;
          border-right: 1px solid #e5e7eb;
        }

        .preview-panel {
          flex: 1;
        }

        @media (max-width: 768px) {
          .wedding-creator-skeleton {
            flex-direction: column;
          }

          .chat-panel,
          .preview-panel {
            width: 100%;
            height: 50%;
          }
        }
      `}</style>

      <div className="chat-panel">
        <ChatSkeleton />
      </div>
      <div className="preview-panel">
        <PreviewSkeleton />
      </div>
    </div>
  );
}

export default WeddingCreatorSkeleton;
