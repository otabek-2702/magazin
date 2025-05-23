<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { Uzbek } from "flatpickr/dist/l10n/uz";
import Skeleton from "@/views/skeleton/Skeleton.vue";
import {
  formatTimestamp,
  getFormattedToday,
  removeSpaces,
  transformPrice,
} from "@/helpers";
import { useFetch } from "@/hooks/useFetch";
import AddNewOutputDrawer from "@/views/cash-register/cash-box/AddNewOutputDrawer.vue";
import AnimatedNumber from "@/@core/components/AnimatedNumber.vue";
import ConfirmDialog from "@/views/cash-register/cash-box/ConfirmDialog.vue";
import PaymentInfoDialog from "@/views/cash-register/InfoDialog.vue";
import { useAppAbility } from "@/plugins/casl/useAppAbility";

const { can } = useAppAbility();
const route = useRoute();

const {
  state,
  items: invoices,
  totalPages: totalPage,
  paginationData,
  fetchData,
  handleSearch,
  searchQuery,
  isFetching,
  metaDatas,
} = useFetch({
  baseUrl: "cashbox_movements",
  resourceKey: "movements",
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
    Приход: { color: "success", prepend: "+" },
    Убыток: { color: "error", prepend: "-" },
    Расход: { color: "error", prepend: "-" },
    Инкассация: { color: "primary", prepend: "-" },
  };

  return roleMap[status] || { color: "primary" };
};

const invoicesListMeta = computed(() => [
  [
    {
      icon: "mdi-cash-multiple",
      color: "secondary",
      title: "Итоговая сумма в кассе",
      stats: metaDatas.value.cashbox?.remains,
    },
    {
      color: "primary",
      title: "Наличные",
      stats: metaDatas.value.cashbox?.remains_details.cash,
    },
  ],
  [
    {
      icon: "bx-credit-card-front",
      color: "primary",
      title: "UZCARD",
      stats: metaDatas.value.cashbox?.remains_details.uzcard,
    },
    {
      color: "primary",
      title: "HUMO",
      stats: metaDatas.value.cashbox?.remains_details.humo,
    },
  ],
  [
    {
      icon: "mdi-cash-plus",
      color: "success",
      title: "Приход",
      stats: metaDatas.value.positive_sum,
    },
    {
      icon: "mdi-cash-minus",
      color: "error",
      title: "Расход",
      stats: metaDatas.value.negative_sum,
    },
  ],
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
  if (newVal === oldValue || !newVal) return;

  const [from, to, ...other] = newVal?.split(" — ");

  state.value.params = {
    ...state.value.params,
    from_date: from,
    to_date: to || from,
  };
});

// Payment Info Dialog

const paymentInfoDialogOpen = ref(false);
const paymentInfoDialogId = ref(0);
const canShowPaymentInvoice = computed(() => can("show", "Payments"));
const isPaymentInvoiceComment = (comment, type) =>
  /^\d+ ID from Payment Invoice$\b/.test(comment) &&
  (type == "Прибыл" || type == "Приход");

const handleInfoDialogOpen = (comment, type) => {
  if (!canShowPaymentInvoice.value || !isPaymentInvoiceComment(comment, type))
    return;

  const id = Number(comment.match(/^(\d+) ID from Payment Invoice$/)?.[1]) || 0;
  if (id) {
    paymentInfoDialogId.value = id;
    paymentInfoDialogOpen.value = true;
  }
};
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
          <VCardText
            class="d-flex justify-space-between"
            v-if="meta.length"
            v-for="item in meta"
          >
            <div>
              <span>{{ item.title }}</span>
              <div class="d-flex align-center gap-2">
                <h6 :class="`text-h6 text-${item.color}`">
                  <AnimatedNumber :number="item.stats" /> so'm
                </h6>
              </div>
              <p
                class="text-m mb-0 mt-2"
                v-if="item.subDatas"
                v-for="subData in item.subDatas"
              >
                {{ subData.title }}:
                <b><AnimatedNumber :number="subData.stats" /></b> so'm
                <br />
              </p>
            </div>

            <VAvatar
              rounded
              variant="tonal"
              :color="item.color"
              :icon="item.icon"
              v-if="item.icon"
            />
          </VCardText>

          <VCardText class="d-flex justify-space-between" v-else>
            <div>
              <span v-if="meta.title">{{ meta.title }}</span>
              <div v-if="meta.title" class="d-flex align-center gap-2">
                <h6 :class="`text-h6 text-${meta.color}`">
                  <AnimatedNumber :number="meta.stats" /> so'm
                </h6>
              </div>
              <p
                class="text-m mb-0 mt-2"
                v-if="meta.subDatas"
                v-for="subData in meta.subDatas"
              >
                {{ subData.title }}:
                <b><AnimatedNumber :number="subData.stats" /></b> so'm
                <br />
              </p>
            </div>

            <VAvatar
              rounded
              variant="tonal"
              :color="meta.color"
              :icon="meta.icon"
              v-if="meta.icon"
            />
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12">
        <VCard>
          <VCardText>
            <VRow>
              <VCol cols="12" sm="auto">
                <VCardTitle class="pa-0">
                  {{ metaDatas?.cashbox?.name ?? "Касса №" }}
                </VCardTitle>
              </VCol>
              <VCol cols="12" sm="3">
                <AppDateTimePicker
                  v-model="dateValue"
                  :config="{ mode: 'range', locale: Uzbek }"
                  placeholder="Выберите диапазон дат"
                  clearable
                  @click:clear="resetDate"
                  density="compact"
                />
              </VCol>

              <VSpacer />
              <VCol cols="auto">
                <Can I="truncate" a="CashBox">
                  <VBtn
                    color="success"
                    prepend-icon="mdi-cash-multiple"
                    class="font-weight-bold"
                    @click="confirmId = route?.params?.id"
                    >Инкассация
                  </VBtn>
                </Can>
              </VCol>
              <VCol cols="auto">
                <Can I="create" a="CashboxOutput">
                  <VBtn @click="isAddNewOutputDrawerVisible = true"
                    >Добавить Расход
                  </VBtn>
                </Can>
              </VCol>
            </VRow>
          </VCardText>

          <VDivider />

          <!-- SECTION Table -->
          <VTable>
            <!-- 👉 Table head -->
            <thead>
              <tr>
                <th data-column="id">ID</th>
                <th>ВРЕМЯ СОЗДАНИЯ</th>
                <th>К-ВО ТОВАРОВ</th>
                <th>ТИП ОПЛАТЫ</th>
                <th>КОММЕНТАРИЙ</th>
              </tr>
            </thead>

            <!-- 👉 Table Body -->
            <tbody>
              <tr
                v-for="invoice in invoices"
                :key="invoice.id"
                :class="{
                  'cursor-pointer':
                    canShowPaymentInvoice &&
                    isPaymentInvoiceComment(invoice.comment, invoice.type),
                }"
                @click="handleInfoDialogOpen(invoice.comment, invoice.type)"
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
    <Can I="create" a="CashboxOutput">
      <AddNewOutputDrawer
        v-model:isDrawerVisible="isAddNewOutputDrawerVisible"
        @fetchDatas="() => fetchData(true)"
        :cashbox_id="parseInt(route?.params?.id)"
      />
    </Can>
    <ConfirmDialog v-model:id="confirmId" @fetchDatas="() => fetchData(true)" />

    <PaymentInfoDialog
      :id="paymentInfoDialogId"
      v-model:isDialogOpen="paymentInfoDialogOpen"
      @fetchDatas="() => {}"
    />
  </section>
</template>

<style lang="scss"></style>
