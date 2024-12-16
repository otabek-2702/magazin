<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { Uzbek } from "flatpickr/dist/l10n/uz";
import Skeleton from "@/views/skeleton/Skeleton.vue";
import {
  fetchOptions,
  formatTimestamp,
  getFormattedToday,
  transformPrice,
} from "@/helpers";
import { useFetch } from "@/hooks/useFetch";
import AddNewDrawer from "@/views/branch/safes/AddNewDrawer.vue";
import AnimatedNumber from "@/@core/components/AnimatedNumber.vue";

const route = useRoute();
const {
  state,
  items: invoices,
  totalPages: totalPage,
  fetchData,
  paginationData,
  isFetching,
  metaDatas,
} = useFetch({
  baseUrl: `safes/${route?.params?.id}/movements`,
  resourceKey: "safe_movements",
  params: {
    from_date: getFormattedToday(),
    to_date: getFormattedToday(),
  },
});

const isAddNewDrawerVisible = ref(false);

// cash data
const resolveInvoiceStatus = (status) => {
  const roleMap = {
    Прибыль: { color: "success", prepend: "+" },
    Доход: { color: "success", prepend: "+" },
    Убыток: { color: "error", prepend: "-" },
    Расход: { color: "error", prepend: "-" },
    Инкассация: { color: "primary", prepend: "-" },
  };

  return roleMap[status] || { color: "primary" };
};

const invoicesListMeta = computed(() => [
  {
    icon: "mdi-cash-minus",
    color: "error",
    title: "Общие затраты (наличные)",
    stats: metaDatas.value.negative_cash_sum,
  },
  {
    icon: "bx-credit-card",
    color: "error",
    title: "Общие затраты (банк)",
    stats: metaDatas.value.negative_bank_sum,
  },
  {
    icon: "mdi-cash-plus",
    color: "success",
    title: "Инкассации касс (наличные)",
    stats: metaDatas.value?.positive_cash_sum,
    subtitle: "Текущий: ",
    substats: metaDatas.value?.safe?.total_amount.cash,
  },
  {
    icon: "bx-credit-card",
    color: "success",
    title: "Инкассации касс (банк)",
    stats: metaDatas.value?.positive_bank_sum,
    subtitle: "Текущий: ",
    substats: metaDatas.value?.safe?.total_amount.bank,
  },
]);

// Date period
const dateValue = ref(getFormattedToday());
const resetDate = () => {
  dateValue.value = getFormattedToday();
};

watch(dateValue, (newVal, oldValue) => {
  if (newVal === oldValue) return;
  const [from, to, ...other] = newVal?.split(" — ");

  state.value.params = {
    ...state.value.params,
    from_date: from,
    to_date: to || from,
  };
});
</script>

<template>
  <section>
    <VRow>
      <VCol
        v-for="meta in invoicesListMeta"
        :key="meta.title"
        cols="12"
        sm="6"
        lg="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex justify-space-between">
              <div>
                <span>{{ meta.title }}</span>
                <div class="d-flex align-center gap-2">
                  <h6 :class="`text-h6 text-${meta.color}`">
                    <AnimatedNumber :number="meta.stats" /> so'm
                  </h6>
                </div>
              </div>

              <VAvatar
                rounded
                variant="tonal"
                :color="meta.color"
                :icon="meta.icon"
              />
            </div>
            <span class="text-sm">{{ meta.subtitle }}</span>
            <span class="text-sm" v-if="meta.substats">
              <AnimatedNumber :number="meta.substats" /> so'm</span
            >
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12">
        <VCard>
          <VCardText>
            <VRow>
              <VCol cols="auto">
                <VCardTitle class="pa-0">
                  {{ metaDatas.safe?.branch?.name ?? "Филиал" }}
                </VCardTitle>
              </VCol>
              <VCol cols="12" sm="3">
                <AppDateTimePicker
                  v-model="dateValue"
                  :config="{ mode: 'range', locale: Uzbek }"
                  placeholder="Выберите диапазон дат"
                  :rules="[requiredValidator]"
                  clearable
                  @click:clear="resetDate"
                  density="compact"
                />
              </VCol>
              <VSpacer />
              <!-- 👉 Search  -->
              <!-- <VCol cols="12" sm="3">
                <VTextField
                  v-model="searchQuery"
                  @keyup.enter="handleSearch"
                  placeholder="Поиск роли"
                  :rules="[]"
                  density="compact"
                />
              </VCol> -->
              <VCol cols="auto">
                <VBtn @click="isAddNewDrawerVisible = true"
                  >Добавить Расход
                </VBtn>
              </VCol>
            </VRow>
          </VCardText>

          <VDivider />

          <!-- SECTION Table -->
          <VTable>
            <!-- 👉 Table head -->
            <thead>
              <tr>
                <th style="width: 48px">ID</th>
                <th>СУММА</th>
                <th>КОММЕНТАРИЙ</th>
                <th>ТИП ТРАНЗАКЦИИ</th>
                <th>ВРЕМЯ СОЗДАНИЯ</th>
              </tr>
            </thead>

            <!-- 👉 Table Body -->
            <tbody v-if="invoices?.length && !isFetching">
              <tr v-for="invoice in invoices" :key="invoice.id">
                <td>{{ invoice.id }}</td>
                <td>
                  <VChip
                    :color="resolveInvoiceStatus(invoice.type).color"
                    density="compact"
                    label
                    class="text-uppercase text-subtitle-1 font-weight-black"
                  >
                    {{ resolveInvoiceStatus(invoice.type).prepend }}
                    {{ transformPrice(invoice.sum) }}
                  </VChip>
                </td>

                <td>{{ invoice.comment }}</td>
                <td>
                  {{ invoice.payment_type ? `${invoice.payment_type} ➔ ` : ""
                  }}{{ invoice.transaction_type?.translate }}
                </td>
                <td>{{ formatTimestamp(invoice?.created_at) }}</td>
              </tr>
            </tbody>

            <Skeleton :count="5" v-if="isFetching" />

            <tfoot v-show="!isFetching && !invoices?.length">
              <tr>
                <td colspan="9" class="text-center text-body-1">
                  Нет доступных данных
                </td>
              </tr>
            </tfoot>
          </VTable>

          <!-- SECTION Pagination -->
          <VDivider />

          <VCardText class="d-flex flex-wrap justify-end gap-4 pa-2">
            <div class="d-flex align-center" style="width: 300px">
              <h6 class="text-sm font-weight-regular">{{ paginationData }}</h6>
            </div>

            <VPagination
              v-if="invoices.length"
              v-model="state.currentPage"
              :length="totalPage"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
    <AddNewDrawer
      v-model:isDrawerVisible="isAddNewDrawerVisible"
      @fetchDatas="() => fetchData(true)"
    />
  </section>
</template>

<style lang="scss"></style>
