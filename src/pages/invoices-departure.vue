<script setup>
import { computed, onMounted, ref, watch, watchEffect } from "vue";
import axios from "@axios";
import Skeleton from "@/views/skeleton/Skeleton.vue";
import InfoDialog from "@/views/invoice-departure/InfoDialog.vue";
import AddNewDialog from "@/views/invoice-departure/AddNewDialog.vue";
import { formatTimestamp } from "@/helpers";
import ConfirmCopyInvoiceDialog from "@/components/ConfirmCopyInvoiceDialog.vue";
import { useAppAbility } from "@/plugins/casl/useAppAbility";

const { can } = useAppAbility();

const searchQuery = ref("");
const finalSearch = ref("");
const rowPerPage = ref(30);
const currentPage = ref(1);
const totalPage = ref(1);
const lastFetchedPage = ref(null);
const totalDatasCount = ref(0);
const invoices = ref([]);

// Get main datas start
const isFetching = ref(false);
const filtersChanged = ref(false);

const fetchData = async (force = false) => {
  if (
    !force &&
    (isFetching.value ||
      (currentPage.value === lastFetchedPage.value && !filtersChanged.value))
  ) {
    return; // Если запрос уже выполняется или страница не изменилась и фильтры не изменялись
  }

  try {
    isFetching.value = true;
    const { data } = await axios.get(
      `/stock_movement_invoices?paginate=30&page=${currentPage.value}&search=${finalSearch.value}`
    );

    invoices.value = data["stock_movement_invoices"];
    lastFetchedPage.value = currentPage.value;
    currentPage.value = data["meta"]["pagination"]["current_page"];
    totalDatasCount.value = data["meta"]["pagination"]["total"];
    totalPage.value = data["meta"]["pagination"]["total_pages"];
    rowPerPage.value = data["meta"]["pagination"]["per_page"];

    filtersChanged.value = false; // Сбрасываем флаг изменений фильтров после загрузки
  } catch (error) {
    console.error("Ошибка загрузки :", error);
  } finally {
    isFetching.value = false;
  }
};

// search
const handleSearch = () => {
  finalSearch.value = searchQuery.value;
  currentPage.value = 1;
  fetchData(true);
};

watch(searchQuery, (newVal) => {
  if (!newVal) {
    finalSearch.value = "";
    currentPage.value = 1;
    fetchData(true);
  }
});

onMounted(() => {
  fetchData();
});

const isInfoDialogVisible = ref(false);

// Pages start

// 👉 watching current page
watch(currentPage, () => {
  if (!isFetching.value) {
    fetchData();
  }
});

// 👉 Watching current page
watchEffect(() => {
  if (currentPage.value > totalPage.value) currentPage.value = totalPage.value;
});

// 👉 Computing pagination data
const paginationData = computed(() => {
  const firstIndex = invoices.value.length
    ? (currentPage.value - 1) * rowPerPage.value + 1
    : 0;
  const lastIndex =
    invoices.value.length + (currentPage.value - 1) * rowPerPage.value;

  return `${firstIndex}-${lastIndex} of ${totalDatasCount.value}`;
});

// Pages end

// Show one
const infoDialogItemId = ref(0);

const handleInfoDialogOpen = (id) => {
  infoDialogItemId.value = id;
  isInfoDialogVisible.value = true;
};

const resolveInvoiceStatus = (status) => {
  const roleMap = {
    Черновик: { color: "primary" },
    Отклонено: { color: "secondary" },
    Подтверждено: { color: "success" },
  };

  return roleMap[status] || { color: "primary" };
};

// Copy Invoice
const copyInvoiceDialogId = ref(0);
</script>

<template>
  <section>
    <VCard>
      <!-- 👉 Head -->
      <VCardItem>
        <VRow>
          <VCol cols="auto">
            <VCardTitle class="pa-0"> Накладные о уходе </VCardTitle>
          </VCol>
          <VSpacer />

          <!-- 👉 Search  -->
          <VCol cols="12" sm="3">
            <VTextField
              v-model="searchQuery"
              @keyup.enter="handleSearch"
              placeholder="Поиск"
              :rules="[]"
              density="compact"
            />
          </VCol>
          <VCol cols="auto">
            <Can I="create" a="DepartureInvoice">
              <AddNewDialog @fetchDatas="() => fetchData(true)" />
            </Can>
          </VCol>
        </VRow>
      </VCardItem>

      <VDivider />

      <VTable>
        <thead>
          <tr>
            <th data-column="id">ID</th>
            <th>СТАТУС</th>
            <th>ФИЛИАЛ-ПОЛУЧАТЕЛЬ</th>
            <th>К-ВО ТОВАРОВ</th>
            <th>ДАТА СОЗДАНИЯ</th>
            <th data-column="actions" v-if="can('copy', 'DepartureInvoice')">
              ДЕЙСТВИЯ
            </th>
          </tr>
        </thead>

        <tbody >
          <tr
            v-for="invoice in invoices"
            :key="invoice.id"
            @click="handleInfoDialogOpen(invoice.id)"
            class="cursor-pointer"
          >
            <td>{{ invoice.id }}</td>

            <td>
              <VChip
                :color="resolveInvoiceStatus(invoice.status).color"
                density="compact"
                label
                class="text-uppercase"
              >
                {{ invoice.status }}
              </VChip>
            </td>
            <td>{{ invoice.to_branch.name }}</td>
            <td>{{ invoice.full_qty }}</td>
            <td>{{ formatTimestamp(invoice.updated_at) }}</td>
            <td>
              <Can I="copy" a="DepartureInvoice">
                <VIcon
                  @click.stop="copyInvoiceDialogId = invoice.id"
                  size="26"
                  icon="mdi-content-copy"
                  color="primary"
                  v-if="invoice.status === 'Подтверждено'"
                ></VIcon>
                <span v-else></span>
              </Can>
            </td>
          </tr>
        </tbody>
        <Skeleton :count="6" v-show="isFetching" />

        <tfoot v-show="!isFetching && !invoices.length">
          <tr>
            <td colspan="15" class="text-center text-body-1">
              Нет доступных данных
            </td>
          </tr>
        </tfoot>
      </VTable>

      <VDivider />

      <VCardText class="d-flex flex-wrap justify-end gap-4 pa-2">
        <div class="d-flex align-center" style="width: 300px">
          <h6 class="text-sm font-weight-regular">{{ paginationData }}</h6>
        </div>

        <VPagination
          v-if="invoices.length"
          v-model="currentPage"
          :length="totalPage"
        />
      </VCardText>
    </VCard>

    <InfoDialog
      v-model:isDialogOpen="isInfoDialogVisible"
      :id="infoDialogItemId"
      @fetchDatas="() => fetchData(true)"
    />
    <ConfirmCopyInvoiceDialog
      v-model:id="copyInvoiceDialogId"
      endpoint-from="stock_movement_invoices"
      endpoint-to="copy_invoice_for_showcase"
    />
  </section>
</template>

<style lang="scss"></style>
