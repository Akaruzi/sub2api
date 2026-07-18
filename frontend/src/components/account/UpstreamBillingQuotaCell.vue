<template>
  <div v-if="eligible && rows.length" class="min-w-[9rem] space-y-1" data-testid="upstream-billing-quota">
    <HelpTooltip width-class="w-72">
      <template #trigger>
        <div class="cursor-help space-y-1">
          <div v-for="row in rows" :key="row.window" class="flex items-center gap-1.5 text-[10px]">
            <span class="w-4 font-medium text-gray-500 dark:text-gray-400">{{ row.window }}</span>
            <span class="w-12 text-right font-mono text-gray-700 dark:text-gray-200">{{ row.percent }}%</span>
            <span class="h-1.5 w-12 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <i class="block h-full rounded-full" :class="row.colorClass" :style="{ width: `${row.width}%` }" />
            </span>
          </div>
        </div>
      </template>
      <div class="space-y-1 text-xs" data-testid="upstream-billing-quota-tooltip">
        <p class="font-medium">{{ t('admin.accounts.upstreamBilling.quotaTitle') }}</p>
        <p v-for="row in rows" :key="row.window">
          {{ row.window }}: {{ row.used }} / {{ row.limit }} ({{ row.percent }}%)<span v-if="row.resetAt"> · {{ t('admin.accounts.upstreamBilling.quotaResetAt', { value: row.resetAt }) }}</span>
        </p>
      </div>
    </HelpTooltip>
  </div>
  <span v-else class="text-sm text-gray-400 dark:text-dark-500" data-testid="upstream-billing-quota-empty">-</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import HelpTooltip from '@/components/common/HelpTooltip.vue'
import type { Account, UpstreamBillingProbeRateLimit } from '@/types'

const props = defineProps<{ account: Account }>()
const { t } = useI18n()

const eligible = computed(() => props.account.platform === 'openai' && props.account.type === 'apikey')
const formatAmount = (value: number) => Number(value.toFixed(4)).toString()
const formatTime = (value?: string) => {
  if (!value || !Number.isFinite(Date.parse(value))) return ''
  return new Date(value).toLocaleString(undefined, { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const rows = computed(() => {
  const snapshot = props.account.extra?.upstream_billing_probe
  if (snapshot?.status !== 'ok') return []
  const limits = snapshot.rate_limits
  if (!limits) return []
  return (['5h', '1d', '7d'] as const).flatMap((window) => {
    const limit = limits[window] as UpstreamBillingProbeRateLimit | undefined
    if (!limit || limit.window !== window || !Number.isFinite(limit.limit) || !Number.isFinite(limit.used) ||
      !Number.isFinite(limit.remaining) || limit.limit < 0 || limit.used < 0 || limit.remaining < 0 || limit.limit === 0) return []
    const rawPercent = limit.used * 100 / limit.limit
    if (!Number.isFinite(rawPercent) || rawPercent < 0) return []
    const percent = Number(rawPercent.toFixed(1))
    return [{
      window,
      used: formatAmount(limit.used),
      limit: formatAmount(limit.limit),
      percent,
      width: Math.min(100, percent),
      resetAt: formatTime(limit.reset_at),
      colorClass: percent >= 100 ? 'bg-red-500 dark:bg-red-400' : percent >= 80 ? 'bg-amber-500 dark:bg-amber-400' : 'bg-emerald-500 dark:bg-emerald-400'
    }]
  })
})
</script>
