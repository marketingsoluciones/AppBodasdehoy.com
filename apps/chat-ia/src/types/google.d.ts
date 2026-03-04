export {};

declare global {
  namespace google {
    namespace accounts {
      namespace id {
        type CredentialResponse = {
          clientId?: string;
          credential?: string;
          select_by?: string;
        };

        type PromptMomentNotification = {
          getNotDisplayedReason(): string | null;
          isNotDisplayed(): boolean;
        };

        type ButtonConfiguration = {
          shape?: 'rectangular' | 'pill' | 'circle' | 'square';
          size?: 'small' | 'medium' | 'large';
          text?:
            | 'signin_with'
            | 'signup_with'
            | 'continue_with'
            | 'signin'
            | 'signup'
            | 'continue';
          theme?: 'outline' | 'filled_blue' | 'filled_black';
          type?: 'standard' | 'icon';
          width?: number;
        };

        function initialize(options: {
          auto_select?: boolean;
          callback: (credential: CredentialResponse) => void;
          client_id: string;
          context?: 'use' | 'signin';
        }): void;

        function renderButton(element: HTMLElement, config?: ButtonConfiguration): void;

        function prompt(
          callback?: (notification: PromptMomentNotification) => void
        ): void;
      }
    }
  }

  interface Window {
    google?: typeof google;
  }
}





