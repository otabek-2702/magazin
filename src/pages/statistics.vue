<script setup>
import { ref } from "vue";
import axios from "@axios";
import { Russian } from "flatpickr/dist/l10n/ru.js";

const dateRange = ref("");
const isDownloading = ref("");

const uzDateFormat = new Intl.DateTimeFormat("fr-CA", {
  timeZone: "Asia/Tashkent",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dateRangeConfig = {
  mode: "range",
  minDate: "2024-01-01",
  maxDate: uzDateFormat.format(new Date()),
  locale: Russian,
  dateFormat: "Y-m-d",
};

const downloadReport = async (endpoint, filename) => {
  if (!dateRange.value) return;

  let from, to;

  if (dateRange.value.includes(" — ")) {
    [from, to] = dateRange.value.split(" — ");
  } else {
    from = to = dateRange.value;
  }

  isDownloading.value = endpoint;
  try {
    const response = await axios.post(
      `/exports/${endpoint}`,
      { from, to },
      {
        responseType: "blob",
        headers: {
          Accept: "application/octet-stream",
          "Content-Type": "application/json",
        },
      }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${filename}|${from}-${to}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } finally {
    isDownloading.value = "";
  }
};
</script>

<template>
  <VCard class="pa-5">
    <VCardTitle class="text-h6 mb-4">Отчеты</VCardTitle>

    <VRow>
      <!-- Выбор периода -->
      <VCol cols="12" md="4">
        <AppDateTimePicker
          v-model="dateRange"
          label="Период отчета"
          prepend-inner-icon="bx-calendar"
          class="date-picker-field"
          :config="dateRangeConfig"
        />
      </VCol>
    </VRow>

    <VRow class="mt-4">
      <VCol cols="12" md="4" sm="6">
        <VBtn
          block
          :loading="isDownloading === 'stock_entries'"
          :disabled="!dateRange || isDownloading.length"
          @click="() => downloadReport('stock_entries', 'приход_товара')"
          color="primary"
          prepend-icon="bx-download"
        >
          Приход товара
        </VBtn>
      </VCol>

      <VCol cols="12" md="4" sm="6">
        <VBtn
          block
          :loading="isDownloading === 'stock_movements'"
          :disabled="!dateRange || isDownloading.length"
          @click="() => downloadReport('stock_movements', 'движение_склада')"
          color="primary"
          prepend-icon="bx-download"
        >
          Движение склада
        </VBtn>
      </VCol>

      <VCol cols="12" md="4" sm="6">
        <VBtn
          block
          :loading="isDownloading === 'sales'"
          :disabled="!dateRange || isDownloading.length"
          @click="() => downloadReport('sales', 'продажи')"
          color="primary"
          prepend-icon="bx-download"
        >
          Продажи
        </VBtn>
      </VCol>

      <VCol cols="12" md="4" sm="6">
        <VBtn
          block
          :loading="isDownloading === 'expenses'"
          :disabled="!dateRange || isDownloading.length"
          @click="() => downloadReport('expenses', 'расходы')"
          color="primary"
          prepend-icon="bx-download"
        >
          Расходы
        </VBtn>
      </VCol>

      <VCol cols="12" md="4" sm="6">
        <VBtn
          block
          :loading="isDownloading === 'encashments'"
          :disabled="!dateRange || isDownloading.length"
          @click="() => downloadReport('encashments', 'инкассация')"
          color="primary"
          prepend-icon="bx-download"
        >
          Инкассация
        </VBtn>
      </VCol>
      <VCol cols="12" md="4" sm="6">
        <VBtn
          block
          :loading="isDownloading === 'returns'"
          :disabled="!dateRange || isDownloading.length"
          @click="() => downloadReport('returns', 'возвраты')"
          color="primary"
          prepend-icon="bx-download"
        >
          Возврат товаров
        </VBtn>
      </VCol>
    </VRow>
  </VCard>
</template>

<style scoped>
.date-picker-field {
  width: 100%;
}
</style>
