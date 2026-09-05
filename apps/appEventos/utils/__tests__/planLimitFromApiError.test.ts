import {
  isPlanLimitOrGuestQuotaError,
  notifyGuestMutationPlanOrGenericError,
} from '../planLimitFromApiError';

describe('isPlanLimitOrGuestQuotaError', () => {
  it('detecta HTTP 402', () => {
    expect(isPlanLimitOrGuestQuotaError({ response: { status: 402 } })).toBe(true);
  });

  it('detecta GraphQL errors con extensions.code GUEST_LIMIT', () => {
    expect(
      isPlanLimitOrGuestQuotaError({
        response: {
          status: 200,
          data: {
            errors: [{ message: 'rejected', extensions: { code: 'GUEST_LIMIT' } }],
          },
        },
      })
    ).toBe(true);
  });

  it('detecta por mensaje (marcador en español)', () => {
    expect(
      isPlanLimitOrGuestQuotaError({
        response: {
          data: {
            errors: [{ message: 'Has alcanzado el límite de invitados del plan' }],
          },
        },
      })
    ).toBe(true);
  });

  it('devuelve false para errores GraphQL no relacionados con plan', () => {
    expect(
      isPlanLimitOrGuestQuotaError({
        response: {
          status: 200,
          data: {
            errors: [{ message: 'Validation failed', extensions: { code: 'BAD_USER_INPUT' } }],
          },
        },
      })
    ).toBe(false);
  });

  it('devuelve false para null', () => {
    expect(isPlanLimitOrGuestQuotaError(null)).toBe(false);
  });

  it('detecta fallo en payload data.data.<mutation> (success: false, errors[].code)', () => {
    expect(
      isPlanLimitOrGuestQuotaError({
        response: {
          data: {
            data: {
              agregarInvitado: {
                success: false,
                errors: [{ message: 'Cuota', code: 'QUOTA_EXCEEDED', field: '' }],
              },
            },
          },
        },
      })
    ).toBe(true);
  });

  it('detecta errors[].code en cuerpo normalizado (sin extensions)', () => {
    expect(
      isPlanLimitOrGuestQuotaError({
        response: {
          data: { errors: [{ message: 'ok', code: 'PLAN_LIMIT' }] },
        },
      })
    ).toBe(true);
  });
});

describe('notifyGuestMutationPlanOrGenericError', () => {
  it('abre modal de plan y toast de cuota ante límite', () => {
    const toast = jest.fn();
    const openPlanModal = jest.fn();
    const t = (k: string) => k;
    notifyGuestMutationPlanOrGenericError(
      {
        response: {
          data: { errors: [{ message: 'x', extensions: { code: 'QUOTA_EXCEEDED' } }] },
        },
      },
      { t, toast, openPlanModal }
    );
    expect(openPlanModal).toHaveBeenCalledWith(true);
    expect(toast).toHaveBeenCalledWith('error', 'planGuestLimitOrQuota');
  });

  it('sin openPlanModal solo muestra toast de plan', () => {
    const toast = jest.fn();
    const t = (k: string) => k;
    notifyGuestMutationPlanOrGenericError(
      { response: { data: { errors: [{ extensions: { code: 'PLAN_LIMIT' } }] } } },
      { t, toast }
    );
    expect(toast).toHaveBeenCalledWith('error', 'planGuestLimitOrQuota');
  });

  it('error genérico usa toast Ha ocurrido un error', () => {
    const toast = jest.fn();
    const t = (k: string) => `__${k}__`;
    notifyGuestMutationPlanOrGenericError(new Error('timeout'), { t, toast });
    expect(toast).toHaveBeenCalledWith('error', expect.stringContaining('__Ha ocurrido un error__'));
  });
});
