/**
 * Tests del módulo de métricas del Copilot (reportCopilotMessageSent, setCopilotMetricsReporter).
 */

import {
  reportCopilotMessageSent,
  setCopilotMetricsReporter,
} from '../copilotMetrics';

describe('copilotMetrics', () => {
  afterEach(() => {
    setCopilotMetricsReporter(() => {});
  });

  it('reportCopilotMessageSent llama al reporter con elapsedMs y stream', () => {
    const fn = jest.fn();
    setCopilotMetricsReporter(fn);

    reportCopilotMessageSent({ elapsedMs: 1500, stream: true });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith({ elapsedMs: 1500, stream: true });
  });

  it('setCopilotMetricsReporter sustituye el reporter', () => {
    const first = jest.fn();
    const second = jest.fn();
    setCopilotMetricsReporter(first);
    reportCopilotMessageSent({ elapsedMs: 100, stream: false });
    expect(first).toHaveBeenCalledTimes(1);

    setCopilotMetricsReporter(second);
    reportCopilotMessageSent({ elapsedMs: 200, stream: true });
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith({ elapsedMs: 200, stream: true });
  });
});
