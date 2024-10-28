<script setup>
import { computed,  ref } from 'vue';
import AddNewDrawer from '@/views/cash-register/cash-box/AddNewDrawer.vue';
import UpdateDrawer from '@/views/cash-register/cash-box/UpdateDrawer.vue';
import Skeleton from '@/views/skeleton/Skeleton.vue';
import { useFetch } from '@/hooks/useFetch';
import { transformPrice } from '@/helpers';
// import InfoDialog from '@/views/cash-register/cash-box/InfoDialog.vue';


const {
  items: cash_boxes,
  currentPage,
  totalPages: totalPage,
  paginationData,
  fetchData,
  handleSearch,
  searchQuery,
  isFetching,
} = useFetch({
  baseUrl: "cashboxes",
  resourceKey: "cashboxes",
  immediate: true,
  initialPage: 1,
  perPage: 30,
  debounceMs: 300,
});


const isAddNewDrawerVisible = ref(false);
const isUpdateDrawerVisible = ref(false);
// const isInfoDialogVisible = ref(false);

// Edit
const updateID = ref(0);
const openEditDrawer = (id) => {
  updateID.value = id;
  isUpdateDrawerVisible.value = true;
};

// // Show one
// const infoDialogItemId = ref(0);

// const handleInfoDialogOpen = (id) => {
//   infoDialogItemId.value = id;
//   isInfoDialogVisible.value = true;
// };

</script>

<template>
  <section>
    <VRow>
      <VCol cols="12">
        <VCard title="Фильтры поиска">
          <VCardText class="d-flex flex-wrap">
            <VSpacer />

            <VCol cols="6" class="app-user-search-filter d-flex align-center">
              <VTextField
                v-model="searchQuery"
                @keyup.enter="handleSearch"
                :rules="[]"
                placeholder="Поиск"
                density="compact"
                class="me-6"
              />
              <Can I="add" a="CashBoxes">
                <VBtn @click="isAddNewDrawerVisible = true">Добавить</VBtn>
              </Can>
            </VCol>
          </VCardText>

          <VDivider />

          <VTable class="text-no-wrap">
            <thead>
              <tr>
                <th style="width: 48px">ID</th>
                <th>ИМЯ</th>
                <th>ОПИСАНИЕ</th>
                <th>ОСТАТОК</th>
                <th>ДЕЙСТВИЯ</th>
              </tr>
            </thead>

            <tbody>
              <tr
                :style="{ cursor: 'pointer' }"
                v-for="cash_box in cash_boxes"
                :key="cash_box.id"
              >
                <td>{{ cash_box.id }}</td>
                <td>{{ cash_box.name }}</td>
                <td class="overflow-hide">{{ cash_box.description }}</td>
                <td >{{ transformPrice(cash_box.remains) }}</td>
                <td class="text-center" :style="{ width: '80px', zIndex: '10' }">
                  <Can I="update" a="CashBoxes">
                    <VIcon
                      @click="
                        (event) => {
                          event.stopPropagation();
                          openEditDrawer(cash_box.id);
                        }
                      "
                      size="30"
                      icon="bx-edit-alt"
                      style="color: rgb(var(--v-global-theme-primary))"
                      class="mx-2"
                    ></VIcon>
                  </Can>
                </td>
              </tr>
            </tbody>
            <Skeleton :count="5" v-show="isFetching && !cash_boxes.length" />

            <tfoot v-show="!isFetching && !cash_boxes.length">
              <tr>
                <td colspan="6" class="text-center text-body-1">Нет доступных данных</td>
              </tr>
            </tfoot>
          </VTable>

          <VDivider />

          <VCardText class="d-flex flex-wrap justify-end gap-4 pa-2">
            <div class="d-flex align-center" style="width: 300px">
              <h6 class="text-sm font-weight-regular">{{ paginationData }}</h6>
            </div>

            <VPagination
              v-if="cash_boxes.length"
              v-model="currentPage"
              :total-visible="7"
              :length="totalPage"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <AddNewDrawer
      v-model:isDrawerOpen="isAddNewDrawerVisible"
      @fetchDatas="() => fetchData(true)"
    />
    <UpdateDrawer
      :id="updateID"
      v-model:isDrawerOpen="isUpdateDrawerVisible"
      @fetchDatas="() => fetchData(true)"
    />

    <!-- <InfoDialog
      v-model:isDrawerOpen="isInfoDialogVisible"
      :productId="infoDialogItemId"
      @fetchDatas="() => fetchData(true)"
    /> -->
    
  </section>
</template>

<style lang="scss">
.app-user-search-filter {
  inline-size: 385px;
}

.text-capitalize {
  text-transform: capitalize;
}
</style>
