import { Button, Form, Input, TextArea } from '@lobehub/ui';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useKnowledgeBaseStore } from '@/store/knowledgeBase';
import { CreateKnowledgeBaseParams } from '@/types/knowledgeBase';

interface CreateFormProps {
  onClose?: () => void;
  onSuccess?: (id: string) => void;
}

const CreateForm = memo<CreateFormProps>(({ onClose, onSuccess }) => {
  const { t } = useTranslation('knowledgeBase');
  const [loading, setLoading] = useState(false);
  const createNewKnowledgeBase = useKnowledgeBaseStore((s) => s.createNewKnowledgeBase);

  const onFinish = async (values: CreateKnowledgeBaseParams) => {
    setLoading(true);

    try {
      const id = await createNewKnowledgeBase(values);
      setLoading(false);

      // Cerrar el modal PRIMERO y diferir la navegación al siguiente tick: si
      // navegamos en el mismo tick, el re-render pierde la referencia del modal
      // (instance.current) antes de que destroy() complete su animación y el
      // modal queda huérfano montado (bug "el modal no se cierra", informe 13-jun).
      onClose?.();

      setTimeout(() => {
        // Call onSuccess callback if provided, otherwise navigate directly
        if (onSuccess) {
          onSuccess(id);
        } else {
          window.location.href = `/knowledge/bases/${id}`;
        }
      }, 0);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <Form
      footer={
        <Button block htmlType={'submit'} loading={loading} type={'primary'}>
          {t('createNew.confirm')}
        </Button>
      }
      gap={16}
      items={[
        {
          children: <Input autoFocus placeholder={t('createNew.name.placeholder')} />,
          label: t('createNew.name.placeholder'),
          name: 'name',
          rules: [{ message: t('createNew.name.required'), required: true }],
        },
        {
          children: (
            <TextArea
              placeholder={t('createNew.description.placeholder')}
              style={{ minHeight: 120 }}
            />
          ),
          label: t('createNew.description.placeholder'),
          name: 'description',
        },
      ]}
      itemsType={'flat'}
      layout={'vertical'}
      onFinish={onFinish}
    />
  );
});

export default CreateForm;
