<script setup>
import { ref } from "vue";
import Skeleton from "@/views/skeleton/Skeleton.vue";
import { useFetch } from "@/hooks/useFetch";
import { useRouter } from "vue-router";
import AnimatedNumber from "@/@core/components/AnimatedNumber.vue";
import AddNewSafesMovementDrawer from "@/views/branch/safes/AddNewSafesMovementDrawer.vue";

const router = useRouter();

const {
  items: safes,
  currentPage,
  totalPages: totalPage,
  fetchData,
  paginationData,
  handleSearch,
  searchQuery,
  isFetching,
} = useFetch({
  baseUrl: "safes",
});

const isAddNewDrawerVisible = ref(false);
</script>

<template>
  <section>
    <VRow>
      <VCol cols="12">
        <VCard >
          <VCardText>
            <VRow>
              <VCol cols="auto">
                <VCardTitle class="pa-0"> Фильтры поиска </VCardTitle>
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
                <VBtn @click="isAddNewDrawerVisible = true"
                  >Добавить Расход
                </VBtn>
              </VCol>
            </VRow>
          </VCardText>

          <VDivider />

          <VTable class="text-no-wrap">
            <thead>
              <tr>
                <th style="width: 48px">ID</th>
                <th>ИМЯ</th>
                <th>НАЛИЧНЫЕ</th>
                <th>БАНК</th>
              </tr>
            </thead>

            <tbody>
              <tr
                :style="{ cursor: 'pointer' }"
                v-for="safe in safes"
                :key="safe.id"
                @click="
                  router.push({
                    name: 'SafeMovements',
                    params: { id: safe.id },
                  })
                "
              >
                <td>{{ safe.id }}</td>
                <td>{{ safe.branch.name }}</td>
                <td class="font-weight-black">
                  <span class="text-success">
                    <AnimatedNumber :number="safe.total_amount?.cash"
                  /></span>
                  so'm
                </td>
                <td class="font-weight-black">
                  <span class="text-success">
                    <AnimatedNumber :number="safe.total_amount?.bank"
                  /></span>
                  so'm
                </td>
                
              </tr>
            </tbody>
            <Skeleton :count="5" v-show="isFetching && !safes.length" />

            <tfoot v-show="!isFetching && !safes.length">
              <tr>
                <td colspan="6" class="text-center text-body-1">
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
              v-if="safes.length"
              v-model="currentPage"
              :length="totalPage"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
    <AddNewSafesMovementDrawer
      v-model:isDrawerVisible="isAddNewDrawerVisible"
      @fetchDatas="() => fetchData(true)"
    />
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
