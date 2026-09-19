import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(
    [
      'export function createHotContext() {',
      '  return {',
      '    on() {},',
      '    send() {},',
      '    accept() {},',
      '    dispose() {},',
      '  };',
      '}',
      'export default { createHotContext };',
      '',
    ].join('\n')
  );
  return { props: {} };
};

export default function ViteClientShim() {
  return null;
}

