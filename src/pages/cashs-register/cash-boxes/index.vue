<script setup>
import { ref } from "vue";
import AddNewDrawer from "@/views/cash-register/cash-box/AddNewDrawer.vue";
import UpdateDrawer from "@/views/cash-register/cash-box/UpdateDrawer.vue";
import Skeleton from "@/views/skeleton/Skeleton.vue";
import { useFetch } from "@/hooks/useFetch";
import { useRouter } from "vue-router";
import AnimatedNumber from "@/@core/components/AnimatedNumber.vue";
import ConfirmDialog from "@/views/cash-register/cash-box/ConfirmDialog.vue";
import { useAppAbility } from "@/plugins/casl/useAppAbility";

const router = useRouter();
const { can } = useAppAbility();

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
});

const isAddNewDrawerVisible = ref(false);
const isUpdateDrawerVisible = ref(false);
const confirmId = ref(0);

// Edit
const updateID = ref(0);
const openEditDrawer = (id) => {
  updateID.value = id;
  isUpdateDrawerVisible.value = true;
};

const openInfoPage = (id) => {
  router.push({
    name: "CashBoxShow",
    params: { id },
  });
};

const isVisible =
  !!localStorage.getItem("featureAccess") || can("manage", "all");
</script>

<template>
  <section>
    <VRow>
      <VCol cols="12">
        <VCard>
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
                <Can I="add" a="CashBoxes">
                  <VBtn @click="isAddNewDrawerVisible = true">Добавить</VBtn>
                </Can>
              </VCol>
            </VRow>
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
                @click="openInfoPage(cash_box.id)"
              >
                <template> </template>
                <td>{{ cash_box.id }}</td>
                <td>{{ cash_box.name }}</td>
                <td class="overflow-hide">{{ cash_box.description }}</td>
                <td><AnimatedNumber :number="cash_box.remains" /></td>
                <td
                  class="text-center"
                  :style="{
                    width: '80px',
                    position: 'relative',
                    zIndex: '1000',
                  }"
                >
                  <VIcon
                    v-if="isVisible"
                    size="30"
                    icon="mdi-cash-multiple"
                    color="success"
                    class="mx-2"
                    @click.stop="confirmId = cash_box.id"
                  ></VIcon>
                  <Can I="update" a="CashBoxes">
                    <VIcon
                      @click.stop="openEditDrawer(cash_box.id)"
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
              v-if="cash_boxes.length"
              v-model="currentPage"
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
    <ConfirmDialog v-model:id="confirmId" @fetchDatas="() => fetchData(true)" />
  </section>
</template>

<style lang="scss"></style>
