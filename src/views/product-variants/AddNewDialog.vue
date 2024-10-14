<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar';
import { nextTick, ref } from 'vue';
import axios from '@axios';
import { toast } from 'vue3-toastify';

const emit = defineEmits(['fetchDatas']);

const isDialogVisible = ref(false);
const isFetching = ref(false);
const isFormValid = ref(false);
const refForm = ref();
const product_id = ref();
const size_id = ref();
const color_id = ref();


const onSubmit = () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      isFetching.value = true;
      try {
        await axios.post('/product_variants', {
          product_id: product_id.value,
          size_id: size_id.value,
          color_id: color_id.value,
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
  isDialogVisible.value = val;
  if (!val) {
    nextTick(() => {
      refForm.value?.reset();
      refForm.value?.resetValidation();
    });
  }
};

const fetchOptions = async (url, dataState, key, customization = { is: false }) => {
  try {
    const response = await axios.get(url);

    if (response.status === 200) {
      if (customization.is) {
        dataState.value = response.data[key].map(customization.method);
      } else {
        dataState.value = response.data[key];
      }
    }
  } catch (error) {
    console.log(error);
  }
};
const products_list = ref([]);
const sizes_list = ref([]);
const colors_list = ref([]);

watch(
  isDialogVisible,
  () => {
    fetchOptions('/sizes', sizes_list, 'sizes');
    fetchOptions('/colors', colors_list, 'colors');
    fetchOptions('/products', products_list, 'products');
  },
  { once: true },
);


</script>

<template>
  <VDialog v-model="isDialogVisible" max-width="600">
    <!-- Dialog Activator -->
    <template #activator="{ props }">
      <VBtn @click="isDialogVisible = true" v-bind="props">Добавить товар</VBtn>
    </template>

    <!-- Dialog Content -->
    <VCard title="Добавить">
      <DialogCloseBtn variant="text" size="small" @click="isDialogVisible = false" />
      <PerfectScrollbar :options="{ wheelPropagation: false }">
        <VCardText>
          <VForm ref="refForm" v-model="isFormValid" @submit.prevent="onSubmit" >
            <VRow>
              <VCol cols="12">
                <VAutocomplete
                  v-model="product_id"
                  label="Выберите товар"
                  :items="products_list"
                  item-title="name"
                  item-value="id" autofocus
                />
              </VCol>

              <VCol cols="6">
                <VSelect
                  v-model="size_id"
                  label="Выберите размер"
                  :items="sizes_list"
                  item-title="name"
                  item-value="id"
                />
              </VCol>

              <VCol cols="6">
                <VAutocomplete
                  v-model="color_id"
                  label="Выберите цвет"
                  :items="colors_list"
                  item-title="name"
                  item-value="id"
                />
              </VCol>
            </VRow>
            <VCardText class="d-flex justify-end gap-2 pt-4 pb-0">
              <VBtn :loading="isFetching" :disabled="isFetching" type="submit" class="me-3">
                Отправить
              </VBtn>
              <VBtn type="reset" variant="tonal" color="secondary" @click="handleDrawerModelValueUpdate(false)">
                Отмена
              </VBtn>
            </VCardText>
          </VForm>
        </VCardText>
      </PerfectScrollbar>
    </VCard>
  </VDialog>
</template>
