<script setup>
import { computed, onMounted, ref, watch } from "vue";
// import { Uzbek } from "flatpickr/dist/l10n/uz";
import Skeleton from "@/views/skeleton/Skeleton.vue";
import { formatTimestamp, getFormattedToday, transformPrice } from "@/helpers";
import { useFetch } from "@/hooks/useFetch";
import AddNewDrawer from "@/views/branch/expense/AddNewDrawer.vue";
import AnimatedNumber from "@/@core/components/AnimatedNumber.vue";

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
  baseUrl: "expenses"
});

const isAddNewDrawerVisible = ref(false);

// cash data

const invoicesListMeta = computed(() => [
  {
    icon: "mdi-cash-minus",
    color: "error",
    title: "Общие затраты за период",
    stats: metaDatas.value.total_sum,
  },
]);



// Date period
// const dateValue = ref();
// const resetDate = () => {
//   dateValue.value = getFormattedToday();
// };
// onMounted(() => {
//   resetDate();
// });

// watch(dateValue, (newVal) => {
//   const [from, to, ...other] = newVal.split(" — ");

//   state.value.params = {
//     ...state.value.params,
//     from_date: from,
//     to_date: to || from,
//   };
// });
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
                <VCardTitle class="pa-0"> Фильтры поиска </VCardTitle>
              </VCol>
              <!-- <VCol cols="12" sm="3">
                <AppDateTimePicker
                  v-model="dateValue"
                  :config="{ mode: 'range', locale: Uzbek }"
                  placeholder="Выберите диапазон дат"
                  :rules="[requiredValidator]"
                  clearable
                  @click:clear="resetDate"
                  density="compact"
                />
              </VCol> -->
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
                <th>ВРЕМЯ СОЗДАНИЯ</th>
                <th>ФИЛИАЛ</th>
                <th>СУММА</th>
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
                <td>{{ invoice?.branch?.name ?? "Фергана" }}</td>
                <td class="font-weight-black text-error">
                  - {{ transformPrice(invoice.amount) }}
                </td>

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
    <AddNewDrawer
      v-model:isDrawerVisible="isAddNewDrawerVisible"
      @fetchDatas="() => fetchData(true)"
    />
  </section>
</template>

<style lang="scss"></style>
