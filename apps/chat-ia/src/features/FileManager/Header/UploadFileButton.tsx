'use client';

import { Button, Dropdown, Icon, MenuProps } from '@lobehub/ui';
import { Upload, Tooltip } from 'antd';
import { css, cx } from 'antd-style';
import { FileUp, FolderUp, UploadIcon, Wallet } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import DragUpload from '@/components/DragUpload';
import { useWallet } from '@/hooks/useWallet';
import { useFileStore } from '@/store/file';

const hotArea = css`
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: transparent;
  }
`;

const UploadFileButton = ({ knowledgeBaseId }: { knowledgeBaseId?: string }) => {
  const { t } = useTranslation('file');

  const pushDockFileList = useFileStore((s) => s.pushDockFileList);
  const { totalBalance, loading, setShowRechargeModal } = useWallet();

  const hasBalance = loading || totalBalance > 0;

  const handleUpload = useCallback(
    async (files: File[]) => {
      if (!hasBalance) {
        setShowRechargeModal(true);
        return;
      }
      await pushDockFileList(files, knowledgeBaseId);
    },
    [hasBalance, setShowRechargeModal, pushDockFileList, knowledgeBaseId],
  );

  const items = useMemo<MenuProps['items']>(
    () => [
      {
        icon: <Icon icon={FileUp} />,
        key: 'upload-file',
        label: (
          <Upload
            beforeUpload={async (file) => {
              await handleUpload([file]);
              return false;
            }}
            multiple={true}
            showUploadList={false}
          >
            <div className={cx(hotArea)}>{t('header.actions.uploadFile')}</div>
          </Upload>
        ),
      },
      {
        icon: <Icon icon={FolderUp} />,
        key: 'upload-folder',
        label: (
          <Upload
            beforeUpload={async (file) => {
              await handleUpload([file]);
              return false;
            }}
            directory
            multiple={true}
            showUploadList={false}
          >
            <div className={cx(hotArea)}>{t('header.actions.uploadFolder')}</div>
          </Upload>
        ),
      },
    ],
    [handleUpload],
  );

  // Sin saldo: mostrar botón de recarga en lugar de upload
  if (!hasBalance) {
    return (
      <Tooltip title="Recarga tu wallet para subir archivos">
        <Button
          icon={Wallet}
          onClick={() => setShowRechargeModal(true)}
          type="primary"
        >
          Recargar para subir
        </Button>
      </Tooltip>
    );
  }

  return (
    <>
      <Dropdown menu={{ items }} placement="bottomRight">
        <Button icon={UploadIcon}>{t('header.uploadButton')}</Button>
      </Dropdown>
      <DragUpload
        enabledFiles
        onUploadFiles={(files) => handleUpload(files)}
      />
    </>
  );
};

export default UploadFileButton;
