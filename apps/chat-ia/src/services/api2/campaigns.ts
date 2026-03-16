import { api2Client } from './client';

export interface CreateCampaignInput {
  name: string;
  type: 'EMAIL' | 'WHATSAPP' | 'SMS' | 'PHONE' | 'SOCIAL_MEDIA' | 'DIRECT_MAIL';
  scheduledAt?: string;
  notes?: string;
  settings?: {
    sendImmediately?: boolean;
    timezone?: string;
  };
  whatsappConfig?: {
    body?: string;
  };
}

export interface CreateCampaignResult {
  success: boolean;
  id?: string;
  name?: string;
  message?: string;
}

const CREATE_CAMPAIGN_MUTATION = `
  mutation CreateCRMCampaign($input: CRM_CampaignInput!) {
    createCRMCampaign(input: $input) {
      success
      message
      campaign {
        id
        name
      }
    }
  }
`;

export async function createCRMCampaign(
  input: CreateCampaignInput,
): Promise<CreateCampaignResult> {
  try {
    const data = await api2Client.query<{
      createCRMCampaign: { success: boolean; message?: string; campaign?: { id: string; name: string } };
    }>(CREATE_CAMPAIGN_MUTATION, { input });
    const result = data.createCRMCampaign;
    return {
      id: result.campaign?.id,
      message: result.message,
      name: result.campaign?.name,
      success: result.success,
    };
  } catch (error) {
    console.error('[campaigns] createCRMCampaign error:', error);
    return { message: String(error), success: false };
  }
}
