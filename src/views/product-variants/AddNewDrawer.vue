<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar';
import { requiredValidator } from '@validators';
import { nextTick, onMounted, ref, watchEffect } from 'vue';
import AppDrawerHeaderSection from '@core/components/AppDrawerHeaderSection.vue';
import axios from '@axios';
import { toast } from 'vue3-toastify';

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['update:isDrawerOpen', 'fetchDatas']);

const isFetching = ref(false);
const isFormValid = ref(false);
const refForm = ref();
const product_id = ref();
const size_id = ref();
const color_id = ref();
const sale = ref();

// 👉 drawer close
const closeNavigationDrawer = () => {
  emit('update:isDrawerOpen', false);
  nextTick(() => {
    refForm.value?.reset();
    refForm.value?.resetValidation();
  });
};

const onSubmit = () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      isFetching.value = true;
      try {
        await axios.post('/product_variants', {
          product_id: product_id.value,
          size_id: size_id.value,
          color_id: color_id.value,
          sale: sale.value,
        });
        emit('fetchDatas');
        toast('Успешно добавлено', {
          theme: 'auto',
          type: 'success',
          dangerouslyHTMLString: true,
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
  emit('update:isDrawerOpen', val);
  if (!val) {
    nextTick(() => {
      refForm.value?.reset();
      refForm.value?.resetValidation();
    });
  }
};

const products_list = ref([]);
const fetchProducts = async () => {
  try {
    const response = await axios.get('/products');

    if (response.status === 200) {
      products_list.value = response.data.products;
    }
  } catch (error) {
    console.log(error);
  }
};

const sizes_list = ref([]);
const fetchSizes = async () => {
  try {
    const response = await axios.get('/sizes');

    if (response.status === 200) {
      sizes_list.value = response.data.sizes;
    }
  } catch (error) {
    console.log(error);
  }
};

const colors_list = ref([]);
const fetchColors = async () => {
  try {
    const response = await axios.get('/colors');

    if (response.status === 200) {
      console.log(response);
      colors_list.value = response.data.colors;
    }
  } catch (error) {
    console.log(error);
  }
};

watch(
  () => props.isDrawerOpen,
  () => {
    fetchSizes();
    // fetchColors();
    fetchProducts();
  },
  { once: true },
);
// onMounted(() => {
//   fetchColors();
//   fetchSizes();
//   fetchProducts();
// });
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
    <AppDrawerHeaderSection title="Добавить" @cancel="closeNavigationDrawer" />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <!-- 👉 Форма -->
          <VForm ref="refForm" v-model="isFormValid" @submit.prevent="onSubmit">
            <VRow>
              <VCol cols="12">
                <VSelect
                  no-data-text="Нет данных"
                  v-model="product_id"
                  label="Выберите товар"
                  :items="products_list"
                  item-title="name"
                  item-value="id"
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>

              <VCol cols="12">
                <VSelect
                  no-data-text="Нет данных"
                  v-model="size_id"
                  label="Выберите размер"
                  :items="sizes_list"
                  item-title="name"
                  item-value="id"
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>

              <VCol cols="12">
                <VSelect
                  no-data-text="Нет данных"
                  v-model="color_id"
                  label="Выберите цвет"
                  :items="colors_list"
                  item-title="created_at"
                  item-value="id"
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="sale"
                  :rules="[requiredValidator]"
                  label="Скидка в процентах"
                  type="number"
                />
              </VCol>

              <!-- 👉 Отправить и Отмена -->
              <VCol cols="12">
                <VBtn :loading="isFetching" :disabled="isFetching" type="submit" class="me-3">
                  Отправить
                </VBtn>
                <VBtn type="reset" variant="tonal" color="secondary" @click="closeNavigationDrawer">
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
