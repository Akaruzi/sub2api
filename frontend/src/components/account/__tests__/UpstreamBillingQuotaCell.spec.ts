import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import UpstreamBillingQuotaCell from '../UpstreamBillingQuotaCell.vue'
import type { Account } from '@/types'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string, params?: Record<string, unknown>) => params?.value ? `${key}:${params.value}` : key }) }))

const account = (rateLimits?: Account['extra']) => ({
  id: 1, name: 'upstream', platform: 'openai', type: 'apikey', proxy_id: null,
  concurrency: 1, priority: 1, status: 'active', error_message: null, last_used_at: null,
  expires_at: null, auto_pause_on_expired: false, created_at: '2026-07-13T00:00:00Z',
  updated_at: '2026-07-13T00:00:00Z', schedulable: true, rate_limited_at: null,
  rate_limit_reset_at: null, overload_until: null, temp_unschedulable_until: null,
  session_window_start: null, session_window_end: null, session_window_status: null,
  extra: rateLimits
}) as Account

describe('UpstreamBillingQuotaCell', () => {
  it('renders percentages, threshold colors, reset time, and dark-mode classes', async () => {
    const wrapper = mount(UpstreamBillingQuotaCell, { attachTo: document.body, props: { account: account({ upstream_billing_probe: { status: 'ok', last_attempt_at: '2026-07-13T00:00:00Z', next_probe_at: '2026-07-13T01:00:00Z', rate_limits: {
      '5h': { window: '5h', limit: 100, used: 20, remaining: 80, reset_at: '2026-07-13T05:00:00Z' },
      '1d': { window: '1d', limit: 100, used: 80, remaining: 20 },
      '7d': { window: '7d', limit: 100, used: 100, remaining: 0 }
    } } }) } })
    expect(wrapper.text()).toContain('20%')
    expect(wrapper.text()).toContain('80%')
    expect(wrapper.text()).toContain('100%')
    expect(wrapper.html()).toContain('bg-emerald-500')
    expect(wrapper.html()).toContain('bg-amber-500')
    expect(wrapper.html()).toContain('bg-red-500')
    expect(wrapper.html()).toContain('dark:bg-emerald-400')
    await wrapper.get('.cursor-help').trigger('mouseenter')
    await nextTick()
    expect(document.body.querySelector('[data-testid="upstream-billing-quota-tooltip"]')?.textContent).toContain('quotaResetAt')
    wrapper.unmount()
  })

  it('shows a dash for absent or invalid quota data and non-API-key accounts', async () => {
    const wrapper = mount(UpstreamBillingQuotaCell, { props: { account: account() } })
    expect(wrapper.get('[data-testid="upstream-billing-quota-empty"]').text()).toBe('-')
    await wrapper.setProps({ account: account({ upstream_billing_probe: { status: 'ok', last_attempt_at: '2026-07-13T00:00:00Z', next_probe_at: '2026-07-13T01:00:00Z', rate_limits: { '7d': { window: '7d', limit: 0, used: 0, remaining: 0 } } } }) })
    expect(wrapper.get('[data-testid="upstream-billing-quota-empty"]').text()).toBe('-')
    await wrapper.setProps({ account: account({ type: 'oauth' }) })
    expect(wrapper.get('[data-testid="upstream-billing-quota-empty"]').text()).toBe('-')
  })
})
