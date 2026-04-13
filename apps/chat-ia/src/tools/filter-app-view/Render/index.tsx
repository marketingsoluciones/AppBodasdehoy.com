import { BuiltinRenderProps } from '@lobechat/types';
import { createStyles } from 'antd-style';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

interface FilterViewContent {
  entity: string;
  ids?: string[];
  query?: string;
}

const ENTITY_META: Record<string, { icon: string; label: string }> = {
  budget_items: { icon: '💰', label: 'partidas de presupuesto' },
  events: { icon: '📅', label: 'eventos' },
  guests: { icon: '👥', label: 'invitados' },
  menus: { icon: '🍽️', label: 'menús' },
  moments: { icon: '📍', label: 'momentos del itinerario' },
  services: { icon: '🛎️', label: 'servicios' },
  tables: { icon: '🪑', label: 'mesas' },
};

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    background: ${token.colorFillTertiary};
    border: 1px solid ${token.colorBorderSecondary};
    border-left: 3px solid ${token.colorPrimary};
    border-radius: ${token.borderRadius}px;
    padding: 10px 14px;
  `,
  count: css`
    font-size: 16px;
    font-weight: 600;
    color: ${token.colorText};
    line-height: 1.3;
  `,
  hint: css`
    font-size: 11px;
    color: ${token.colorTextQuaternary};
    margin-top: 2px;
  `,
  query: css`
    font-size: 12px;
    color: ${token.colorTextSecondary};
    font-style: italic;
  `,
}));

const FilterAppViewRender = memo<BuiltinRenderProps<FilterViewContent>>(({ content }) => {
  const { styles } = useStyles();

  if (!content?.entity) return null;

  const { entity, ids = [], query } = content;
  const meta = ENTITY_META[entity] ?? { icon: '🔍', label: entity };
  const count = ids.length;

  return (
    <Flexbox className={styles.container} gap={4}>
      <Flexbox align="center" gap={10} horizontal>
        <span style={{ fontSize: 22 }}>{meta.icon}</span>
        <Flexbox gap={2}>
          <div className={styles.count}>
            {count} {meta.label} filtrados
          </div>
          {query && <div className={styles.query}>"{query}"</div>}
        </Flexbox>
      </Flexbox>
      <div className={styles.hint}>Filtro activo en la app · pulsa ✕ en el banner rosa para quitarlo</div>
    </Flexbox>
  );
});

FilterAppViewRender.displayName = 'FilterAppViewRender';

export default FilterAppViewRender;
