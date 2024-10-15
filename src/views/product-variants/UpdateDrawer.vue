<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar';
import { nextTick, ref, watch, watchEffect } from 'vue';
import AppDrawerHeaderSection from '@core/components/AppDrawerHeaderSection.vue';
import axios from '@axios';
import { toast } from 'vue3-toastify';

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
  id: {
    required: true,
  },
});

const emit = defineEmits(['update:isDrawerOpen', 'fetchDatas']);

const isFormValid = ref(false);
const isFetching = ref(false);
const isFetchingStart = ref(true);
const refForm = ref();
const product_id = ref();
const size_id = ref();
const color_id = ref();

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
        await axios.put('/product_variants', {
          product_id: product_id.value,
          size_id: size_id.value,
          color_id: color_id.value,
        });

        toast('Успешно', {
          theme: 'auto',
          type: 'success',
          dangerouslyHTMLString: true,
        });
        // Убедитесь, что fetch вызывается только после успешного обновления
        emit('fetchDatas');
        handleDrawerModelValueUpdate(false);
      } catch (error) {
        console.error('Ошибка при обновлении кандидата:', error);
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

const fetchDataById = async () => {
  isFetchingStart.value = true;
  try {
    const response = await axios.get(`/product_variants/${props.id}`);

    if (response.status === 200) {
      product_id.value = response.data.products_variant.id;
      size_id.value = response.data.products_variant.size.id;
      color_id.value = response.data.products_variant.color.id;
    }
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    isFetchingStart.value = false;
  }
};

watch(
  () => props.isDrawerOpen,
  async (newVal) => {
    if (newVal && props.id) fetchDataById();
  },
);

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
     fetchColors();
    // fetchProducts();
  },
  { once: true },
);
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
    <AppDrawerHeaderSection title="Изменить" @cancel="closeNavigationDrawer" />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <!-- 👉 Форма -->
          <VForm
            :disabled="isFetching"
            v-if="!isFetchingStart"
            ref="refForm"
            v-model="isFormValid"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <!-- <VCol cols="12">
                <VSelect
                  v-model="product_id"
                  label="Выберите товар"
                  :items="products_list"
                  item-title="name"
                  item-value="id"
                  
                />
              </VCol> -->

              <VCol cols="12">
                <VSelect
                  v-model="size_id"
                  label="Выберите размер"
                  :items="sizes_list"
                  item-title="name"
                  item-value="id"
                  
                />
              </VCol>

              <VCol cols="12">
                <VSelect
                  v-model="color_id"
                  label="Выберите цвет"
                  :items="colors_list"
                  item-title="name"
                  item-value="id"
                  
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
          <div v-if="isFetchingStart" class="d-flex h-screen align-center justify-center">
            <VProgressCircular color="primary" indeterminate></VProgressCircular>
          </div>
        </VCardText>
      </VCard>
    </PerfectScrollbar>
  </VNavigationDrawer>
</template>
