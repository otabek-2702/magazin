<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar';
import { nextTick, onMounted, ref, watch } from 'vue';
import axios from '@axios';
import { toast } from 'vue3-toastify';
import { transformPrice } from '@/helpers';
import Skeleton from '@/views/skeleton/Skeleton.vue';

const props = defineProps({
  id: {
    required: true,
  },
  isDialogOpen: {
    type: Boolean,
    required: true,
  },
});
const emit = defineEmits(['update:isDialogOpen', 'fetchDatas']);

const isFetchingStart = ref(true);
const isFetching = ref('');
const isFormValid = ref(false);
const refForm = ref();
const to_branch_id = ref();
const status = ref();
const sku_input = ref();
const product_variant_sku = ref();
const product_variant_data = ref();
const quantity_input = ref();
const quantity = ref();
const product_variants = ref([]);

const fetchDataById = async () => {
  isFetchingStart.value = true;
  try {
    const response = await axios.get(`/stock_movement_invoices/${props.id}`);

    if (response.status === 200) {
      const {
        data: { stock_movement_invoice },
      } = response;
      // to_branch_id.value = stock_movement_invoice.branch.id;
      to_branch_id.value = 1;
      status.value = stock_movement_invoice.status;

      product_variants.value = stock_movement_invoice.items.map((el) => ({
        ...el,
        variant: product_variants_list.value.find((e) => e.id == el.product_variant_id),
      }));
    }
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    isFetchingStart.value = false;
  }
};

const onSubmit = async () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      isFetching.value = 'submit';
      try {
        await axios.put(`/stock_movement_invoices/${props.id}`, {
          to_branch_id: to_branch_id.value ?? 0,

          items: product_variants.value.map((el) => ({
            product_variant_id: el.variant.id,
            quantity: el.quantity,
          })),
        });
        emit('fetchDatas');
        toast('Успешно', {
          theme: 'auto',
          type: 'success',
          dangerouslyHTMLString: true,
        });
        handleDialogModelValueUpdate(false);
      } catch (error) {
        console.error(error);
      } finally {
        isFetching.value = '';
      }
    }
  });
};

const onConfirmSubmit = async () => {
  isFetching.value = 'confirm';
  try {
    const reponse = await axios.post(`/stock_movement_invoices/confirm/${props.id}`);
    if (reponse.status === 200) {
      toast('Успешно', {
        theme: 'auto',
        type: 'success',
        dangerouslyHTMLString: true,
      });
      emit('fetchDatas');

      handleDialogModelValueUpdate(false);
    }
  } catch (error) {
    console.log(error);
  } finally {
    isFetching.value = '';
  }
};

const onRejectSubmit = async () => {
  isFetching.value = 'reject';
  try {
    const reponse = await axios.post(`/stock_movement_invoices/reject/${props.id}`);
    if (reponse.status === 200) {
      toast('Успешно', {
        theme: 'auto',
        type: 'success',
        dangerouslyHTMLString: true,
      });
      emit('fetchDatas');

      handleDialogModelValueUpdate(false);
    }
  } catch (error) {
    console.log(error);
  } finally {
    isFetching.value = '';
  }
};

const handleDialogModelValueUpdate = (val) => {
  emit('update:isDialogOpen', false);
  if (!val) {
    nextTick(() => {
      refForm.value?.reset();
      refForm.value?.resetValidation();
      product_variants.value = [];
      status.value= ""
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
const product_variants_list = ref([]);
const branches_list = ref([]);

watch(
  () => props.isDialogOpen,
  async (newVal) => {
    if (newVal && props.id) {
      await fetchOptions('/product_variants', product_variants_list, 'products_variants', {
        method: (el) => ({
          ...el,
          name: `${el.product.name} | ${el.color.name} | ${el.size.name}`,
        }),
        is: true,
      });
      await fetchDataById();
    }
  },
);

onMounted(() => {
  fetchOptions('/branches', branches_list, 'branches');
});

const findProductVariant = (sku) => {
  product_variant_data.value = product_variants_list.value.find((e) => e.sku == sku);
  if (!product_variant_data.value) {
    toast('Товар не найден', {
      theme: 'auto',
      type: 'error',
      dangerouslyHTMLString: true,
    });
    return;
  }
  quantity_input.value.focus();
  quantity.value = product_variant_data.value.amount_remainder ?? 0;
  product_variant_sku.value = null;
};

// Add
const addToList = () => {
  if (!product_variant_data.value) {
    toast('Товар не найден', {
      theme: 'auto',
      type: 'error',
      dangerouslyHTMLString: true,
    });
    product_variant_data.value = null;
    quantity.value = null;
    sku_input.value.focus();
    return;
  } else if (product_variants.value.find((el) => el.variant.id == product_variant_data.value.id)) {
    toast('Дубликат', {
      theme: 'auto',
      type: 'error',
      dangerouslyHTMLString: true,
    });
    product_variant_data.value = null;
    quantity.value = null;
    sku_input.value.focus();
    return;
  }

  product_variants.value.push({
    variant: product_variant_data.value,
    quantity: quantity.value,
  });
  product_variant_data.value = null;
  quantity.value = null;
  sku_input.value.focus();
};

// Delete
const deleteListItem = (id) => {
  product_variants.value = product_variants.value.filter((el) => el.variant.id != id);
};

const calculateCount = computed(() => {
  return transformPrice(
    product_variants.value.reduce((accumulator, el) => accumulator + parseFloat(el.quantity), 0),
  );
});
</script>

<template>
  <VDialog
    fullscreen
    :model-value="props.isDialogOpen"
    @update:model-value="handleDialogModelValueUpdate"
  >
    <VCard title="Накладная">
      <DialogCloseBtn variant="text" size="small" @click="handleDialogModelValueUpdate(false)" />
      <PerfectScrollbar :options="{ wheelPropagation: false }">
        <VCardText>
          <VForm ref="refForm" v-model="isFormValid" @submit.prevent="onSubmit">
            <VRow>
              <VCol cols="4">
                <VAutocomplete
                  v-model="to_branch_id"
                  label="Выберите филиал"
                  :items="branches_list"
                  item-title="name"
                  item-value="id"
                  :readonly="status != 'Черновик'"
                  :clearable="status == 'Черновик'"
                />
              </VCol>

              <VDivider />

              <VCol cols="12">
                <VTable class="text-no-wrap">
                  <thead>
                    <tr>
                      <th style="width: 48px">ID</th>
                      <th>ТОВАР</th>
                      <th>КОЛИЧЕСТВО</th>
                      <th v-if="status == 'Черновик'">ДЕЙСТВИЯ</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr v-for="(variant, i) in product_variants" :key="variant.id">
                      <td>{{ i + 1 }}</td>
                      <td>
                        {{ variant.variant.name }}
                      </td>
                      <td>{{ variant.quantity }}</td>
                      <td
                        class="text-center"
                        :style="{ width: '80px', zIndex: '10' }"
                        v-if="status == 'Черновик'"
                      >
                        <VIcon
                          size="30"
                          icon="mdi-minus-circle-outline"
                          style="color: red"
                          @click="deleteListItem(variant.variant.id)"
                        ></VIcon>
                      </td>
                    </tr>
                  </tbody>

                  <tfoot v-show="product_variants.length">
                    <tr>
                      <td colspan="2"></td>
                      <td class="text-body-1">Общее количество: {{ calculateCount }}</td>
                      <td></td>
                      <td v-if="status == 'Черновик'"></td>
                    </tr>
                  </tfoot>

                  <Skeleton :count="4" v-show="isFetchingStart && !product_variants.length" />

                  <tfoot v-show="!isFetchingStart && !product_variants.length">
                    <tr>
                      <td colspan="9" class="text-center text-body-1">Нет доступных данных</td>
                    </tr>
                  </tfoot>
                </VTable>
              </VCol>

              <VDivider />

              <VForm v-if="status == 'Черновик'" class="w-100 py-5">
                <VRow>
                  <VCol cols="3">
                    <VTextField
                      v-model="product_variant_sku"
                      ref="sku_input"
                      @keyup.enter="findProductVariant(product_variant_sku)"
                      label="Штрих код товара"
                      :items="product_variants_list"
                      item-title="name"
                      item-value="id"
                      :rules="[]"
                    />
                  </VCol>

                  <VCol cols="5">
                    <h4 class="pt-1">Товар: {{ product_variant_data?.name }}</h4>
                    <p class="pt-2 mb-0">
                      На складе: <b>{{ product_variant_data?.amount_remainder ?? 0 }}</b>
                    </p>
                  </VCol>

                  <VCol cols="3">
                    <VTextField
                      v-model="quantity"
                      ref="quantity_input"
                      @keyup.enter="addToList"
                      label="Количество"
                      type="number"
                      :rules="[]"
                    />
                  </VCol>
                  <VCol cols="1" class="d-flex justify-center align-center">
                    <VBtn
                      @click="addToList"
                      style="
                        color: white !important;
                        background-color: #4caf50 !important;
                        border-radius: 5px !important;
                      "
                    >
                      <VIcon size="35" icon="bx-plus"></VIcon>
                    </VBtn>
                  </VCol>
                </VRow>
              </VForm>
            </VRow>
            <VCardText class="d-flex justify-end gap-2 pt-2">
              <VBtn
                v-if="status == 'Черновик'"
                :loading="isFetching == 'submit'"
                :disabled="isFetching == 'submit'"
                type="submit"
                class="me-3"
              >
                Сохранить изменения
              </VBtn>
              <VBtn
                :loading="isFetching == 'confirm'"
                :disabled="isFetching == 'confirm'"
                @click="onConfirmSubmit"
                color="success"
                v-if="status == 'Черновик'"
                class="me-3"
              >
                Подтвердить
                <VIcon end icon="bx-check-circle" />
              </VBtn>
              <VBtn
                :loading="isFetching == 'reject'"
                :disabled="isFetching == 'reject'"
                @click="onRejectSubmit"
                color="secondary"
                v-if="status == 'Черновик'"
              >
                Отменить <VIcon end icon="bx-minus-circle" />
              </VBtn>
            </VCardText>
          </VForm>
        </VCardText>
      </PerfectScrollbar>
    </VCard>
  </VDialog>
</template>

<style scoped>
.bg-green {
  background-color: green;
}
</style>
