<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { Uzbek } from "flatpickr/dist/l10n/uz";
import Skeleton from "@/views/skeleton/Skeleton.vue";
import { formatTimestamp, getFormattedToday, transformPrice } from "@/helpers";
import { useFetch } from "@/hooks/useFetch";
import AddNewOutputDrawer from "@/views/cash-register/cash-box/AddNewOutputDrawer.vue";
import AnimatedNumber from "@/@core/components/AnimatedNumber.vue";
import ConfirmDialog from "@/views/cash-register/cash-box/ConfirmDialog.vue";

const route = useRoute();

const {
  state,
  items: invoices,
  totalPages: totalPage,
  paginationData,
  fetchData,
  isFetching,
  metaDatas,
} = useFetch({
  baseUrl: "cashbox_movements",
  params: {
    cashbox_id: route?.params?.id,
    from_date: getFormattedToday(),
    to_date: getFormattedToday(),
  },
});

const cashbox = computed(() => invoices.value[0]?.cashbox);

const confirmId = ref(0);

// cash data

const resolveInvoiceStatus = (status) => {
  const roleMap = {
    Прибыл: { color: "success", prepend: "+" },
    Доход: { color: "success", prepend: "+" },
    Убыток: { color: "error", prepend: "-" },
    Расход: { color: "error", prepend: "-" },
    Инкассация: { color: "primary", prepend: "-" },
  };

  return roleMap[status] || { color: "primary" };
};

const invoicesListMeta = computed(() => [
  {
    icon: "mdi-cash-multiple",
    color: "secondary",
    title: "Итоговая сумма в кассе",
    stats: cashbox.value?.remains,
  },
  {
    icon: "mdi-cash-plus",
    color: "success",
    title: "Доход",
    stats: metaDatas.value.positive_sum,
  },
  {
    icon: "mdi-cash-minus",
    color: "error",
    title: "Расход",
    stats: metaDatas.value.negative_sum,
  },
  {
    icon: "mdi-bank",
    color: "primary",
    title: "Инкассация",
    stats: metaDatas.value.clear_sum,
  },
]);

const isAddNewOutputDrawerVisible = ref(false);

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
const isVisible =
  !!localStorage.getItem("featureAccess") ||
  JSON.parse(localStorage.getItem("userData"))?.user_id === 1;
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
          <VCardText class="d-flex justify-space-between">
            <div>
              <span>{{ meta.title }}</span>
              <div class="d-flex align-center gap-2">
                <h6 :class="`text-h6 text-${meta.color}`">
                  <AnimatedNumber :number="meta.stats" /> so'm
                </h6>
              </div>
              <span class="text-sm">{{ meta.subtitle }}</span>
            </div>

            <VAvatar
              rounded
              variant="tonal"
              :color="meta.color"
              :icon="meta.icon"
            />
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12">
        <VCard>
          <VCardText>
            <VRow>
              <VCol cols="auto">
                <VCardTitle class="pa-0">
                  {{ cashbox?.name ?? "Касса №" }}
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
              <VCol cols="auto">
                <VBtn
                  v-if="isVisible"
                  color="success"
                  prepend-icon="mdi-cash-multiple"
                  class="font-weight-bold"
                  @click="confirmId = route?.params?.id"
                  >Инкассация
                </VBtn>
              </VCol>
              <VCol cols="auto">
                <VBtn @click="isAddNewOutputDrawerVisible = true"
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
                <th>ВРЕМЯ СОЗДАНИЯ</th>
                <th>К-ВО ТОВАРОВ</th>
                <th>ТИП ОПЛАТЫ</th>
                <th>КОММЕНТАРИЙ</th>
              </tr>
            </thead>

            <!-- 👉 Table Body -->
            <tbody v-if="invoices?.length && !isFetching">
              <tr
                v-for="invoice in invoices"
                :key="invoice.id"
                @click="handleInfoDialogOpen(invoice.id)"
                style="cursor: pointer"
              >
                <td>{{ invoice.id }}</td>
                <td>{{ formatTimestamp(invoice?.created_at) }}</td>
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
                <td>{{ invoice.payment_type }}</td>
                <td>{{ invoice.comment }}</td>
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
    <AddNewOutputDrawer
      v-model:isDrawerVisible="isAddNewOutputDrawerVisible"
      @fetchDatas="() => fetchData(true)"
      :cashbox_id="parseInt(route?.params?.id)"
    />
    <ConfirmDialog v-model:id="confirmId" @fetchDatas="() => fetchData(true)" />
  </section>
</template>

<style lang="scss"></style>
