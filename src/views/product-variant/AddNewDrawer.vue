<script setup>
import { PerfectScrollbar } from "vue3-perfect-scrollbar";
import { nextTick, onMounted, ref, watchEffect } from "vue";
import AppDrawerHeaderSection from "@core/components/AppDrawerHeaderSection.vue";
import axios from "@axios";
import { toast } from "vue3-toastify";
import { fetchOptions } from "@/helpers";

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["update:isDrawerOpen", "fetchDatas"]);

const isFetching = ref(false);
const isFetchingVariant = ref(false);
const isFormValid = ref(false);
const refForm = ref();
const product_id = ref();
const sizes_id = ref();
const colors_id = ref();
const product_search_input = ref("");

const onSubmit = () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      isFetching.value = true;
      try {
        await axios.post("/product_variants", {
          product_id: product_id.value,
          sizes_list: sizes_id.value,
          colors_list: colors_id.value,
        });
        emit("fetchDatas");
        toast("Успешно добавлено", {
          theme: "auto",
          type: "success",
          
        });
        handleDrawerModelValueUpdate(false);
      } catch (error) {
        console.error(error);
      } finally {
        isFetching.value = false;
      }
    }
  });
};

const handleDrawerModelValueUpdate = (val) => {
  emit("update:isDrawerOpen", val);
  if (!val) {
    refForm.value?.reset();
    refForm.value?.resetValidation();
  }
};

const products_list = ref([]);
const sizes_list = ref([]);
const colors_list = ref([]);

const fetchProducts = async () => {
  isFetchingVariant.value = true;
  try {
    const response = await axios.get("/products", {
      params: {
        paginate: 50,
        search: product_search_input.value?.slice(0, 5),
      },
    });

    if (response.status === 200) {
      products_list.value = response.data["products"]
    }
  } catch (error) {
    console.log(error);
  } finally {
    isFetchingVariant.value = false;
  }
};

watch(
  () => props.isDrawerOpen,
  () => {
    fetchProducts();
    fetchOptions("/sizes", sizes_list, "sizes");
    fetchOptions("/colors", colors_list, "colors");
  },
  { once: true }
);

watch(product_search_input, (newVal) => {
  if (newVal?.length >= 2 && !product_id.value) {
    fetchProducts();
  }
});
</script>

<template>
  <VNavigationDrawer
    temporary
    :width="400"
    location="end"
    class="scrollable-content"
    :model-value="props.isDrawerOpen"
    @update:model-value="handleDrawerModelValueUpdate"
  >
    <!-- 👉 Заголовок -->
    <AppDrawerHeaderSection
      title="Добавить"
      @cancel="handleDrawerModelValueUpdate(false)"
    />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <!-- 👉 Форма -->
          <VForm ref="refForm" v-model="isFormValid" @submit.prevent="onSubmit">
            <VRow>
              <VCol cols="12">
                <VAutocomplete
                  v-model="product_id"
                  label="Выберите товар"
                  variant="filled"
                  :items="products_list"
                  item-title="name"
                  item-value="id"
                  :rules="[]"
                  v-model:search="product_search_input"
                  :loading="isFetchingVariant"
                  autofocus
                />
              </VCol>

              <VCol cols="12">
                <VSelect
                  v-model="sizes_id"
                  label="Выберите размер"
                  :items="sizes_list"
                  item-title="name"
                  item-value="id"
                  multiple
                />
              </VCol>

              <VCol cols="12">
                <VSelect
                  v-model="colors_id"
                  label="Выберите цвет"
                  :items="colors_list"
                  item-title="name"
                  item-value="id"
                  multiple
                />
              </VCol>


              <!-- 👉 Отправить и Отмена -->
              <VCol cols="12">
                <VBtn
                  :loading="isFetching"
                  :disabled="isFetching"
                  type="submit"
                  class="me-3"
                >
                  Отправить
                </VBtn>
                <VBtn
                  type="reset"
                  variant="tonal"
                  color="secondary"
                  @click="handleDrawerModelValueUpdate(false)"
                >
                  Отмена
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </PerfectScrollbar>
  </VNavigationDrawer>
</template>
