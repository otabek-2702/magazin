<script setup>
import { ref } from 'vue';
import axios from '@axios';
import ApexChartExpenseRatio from '@/views/statistics/ApexChartExpenseRatio.vue';
import ChartJsBarChart from '@/views/statistics/ChartJsBarChart.vue';

const chartJsCustomColors = {
  white: '#fff',
  yellow: '#ffe802',
  primary: '#836af9',
  areaChartBlue: '#2c9aff',
  barChartYellow: '#ffcf5c',
  polarChartGrey: '#4f5d70',
  polarChartInfo: '#299aff',
  lineChartYellow: '#d4e157',
  polarChartGreen: '#28dac6',
  lineChartPrimary: '#9e69fd',
  lineChartWarning: '#ff9800',
  horizontalBarInfo: '#26c6da',
  polarChartWarning: '#ff8131',
  scatterChartGreen: '#28c76f',
  warningShade: '#ffbd1f',
  areaChartBlueLight: '#84d0ff',
  areaChartGreyLight: '#edf1f4',
  scatterChartWarning: '#ff9f43',
}
</script>

<template>
  <section>
    <VRow>
      <VCol cols="12" md="6">
        <VCard title="Соотношение расходов" subtitle="Расходы по различным категориям">
          <VCardText>
            <ApexChartExpenseRatio />
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <VCard>
          <VCardItem class="d-flex flex-wrap justify-space-between gap-4">
            <VCardTitle>Последняя статистика</VCardTitle>

            <template #append>
              <div class="date-picker-wrapper">
                <AppDateTimePicker
                  model-value="2022-06-09"
                  prepend-inner-icon="bx-calendar-alt"
                  density="compact"
                  :config="{ position: 'auto right' }"
                />
              </div>
            </template>
          </VCardItem>

          <VCardText>
            <ChartJsBarChart :colors="chartJsCustomColors" />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </section>
</template>

<style></style>
