'use client';

import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useChatInputStore } from '../store';
import ExpandButton from './ExpandButton';
import SendButton from './SendButton';

const SendArea = memo(() => {
  const allowExpand = useChatInputStore((s) => s.allowExpand);

  return (
    <Flexbox align={'center'} flex={'none'} gap={6} horizontal>
      {allowExpand && <ExpandButton />}
      <SendButton />
    </Flexbox>
  );
});

SendArea.displayName = 'SendArea';

export default SendArea;
