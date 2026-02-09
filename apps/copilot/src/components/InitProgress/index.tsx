import { Icon, Text } from '@lobehub/ui';
import { Progress } from 'antd';
import { useTheme } from 'antd-style';
import { Loader2 } from 'lucide-react';
import { ReactNode, memo } from 'react';
import { Center, Flexbox } from 'react-layout-kit';

export interface StageObjectItem {
  icon?: ReactNode;
  text: string;
}
export type StageItem = string | StageObjectItem;

interface InitingProps {
  activeStage: number;
  stages: StageItem[];
}

const InitProgress = memo<InitingProps>(({ activeStage, stages }) => {
  const theme = useTheme();

  const outStage = stages[activeStage];
  const percent = Math.min((activeStage / (stages.length - 1)) * 100, 100);

  const stage = typeof outStage === 'string' ? { text: outStage } : outStage;

  // ✅ MEJORADO: Mostrar porcentaje y etapa actual
  const currentStageNumber = activeStage + 1;
  const totalStages = stages.length;

  return (
    <Center gap={12} width={450}>
      <Progress
        percent={parseInt(percent.toFixed(0))}
        showInfo={false}
        size={6}
        strokeColor={theme.colorPrimary}
        style={{ width: '100%' }}
      />
      {/* ✅ MEJORADO: Todo en una línea horizontal con mejor formato */}
      <Flexbox align={'center'} gap={8} horizontal style={{ flexWrap: 'nowrap', justifyContent: 'center', width: '100%' }}>
        {stage?.icon ? stage?.icon : <Icon icon={Loader2} size={16} spin />}
        <Text style={{ flexShrink: 0, fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap' }} type={'secondary'}>
          {currentStageNumber} de {totalStages}
        </Text>
        <Text style={{ fontSize: 14, fontWeight: 400, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} type={'secondary'}>
          {stage?.text}
        </Text>
      </Flexbox>
    </Center>
  );
});

export default InitProgress;
