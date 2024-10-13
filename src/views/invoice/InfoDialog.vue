<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar';
import { nextTick, onMounted, ref, watch } from 'vue';
import axios from '@axios';
import { toast } from 'vue3-toastify';
import { transformPrice } from '@/helpers';
import Skeleton from '../skeleton/Skeleton.vue';

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
const batches_id = ref();
const currency_id = ref();
const exchange_rate = ref();
const status = ref();
const product_variant_id = ref();
const quantity = ref();
const price = ref('');
const rate_symbol = ref();
const product_variants = ref([]);

const fetchDataById = async () => {
  isFetchingStart.value = true;
  try {
    const response = await axios.get(`/invoices/${props.id}`);

    if (response.status === 200) {
      const {
        data: { invoice },
      } = response;
      batches_id.value = invoice.batch.id;
      currency_id.value = invoice.currency.id;
      exchange_rate.value = invoice.exchange_rate;
      status.value = invoice.status;
      product_variants.value = invoice.items.map((el) => ({
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

const removeSpaces = (input) => {
  return input.replace(/\s+/g, '');
};

const onSubmit = async () => {
  if (true) {
    isFetching.value = 'submit';
    try {
      await axios.put(`/invoices/${props.id}`, {
        batch_id: batches_id.value ?? 0,
        currency_id: currency_id.value,
        exchange_rate: exchange_rate.value,

        items: product_variants.value.map((el) => ({
          product_variant_id: el.variant.id,
          price: removeSpaces(el.price),
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
};

const onConfirmSubmit = async () => {
  isFetching.value = 'confirm';
  try {
    const reponse = await axios.post(`/invoices/confirm/${props.id}`);
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
    const reponse = await axios.post(`/invoices/reject/${props.id}`);
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
const batches_list = ref([]);
const exchanges_list = ref([]);

// auto exchange_rate
watch(currency_id, (newVal) => {
  exchange_rate.value = exchanges_list.value.find((e) => e.id == newVal)?.rate ?? null;
});

onMounted(() => {
  fetchOptions('/batches', batches_list, 'batches');
  fetchOptions('/exchange_rates', exchanges_list, 'exchange_rates');
});
watch(
  () => props.isDialogOpen,
  async (newVal) => {
    if (newVal && props.id) {
      await fetchOptions('/product_variants', product_variants_list, 'products_variants', {
        method: (el) => ({
          ...el,
          name: `${el.product.name} | ${el.size.name} | ${el.color.name}`,
        }),
        is: true,
      });
      await fetchDataById();
    }
  },
);

watch(currency_id, (newVal) => {
  if (newVal) {
    rate_symbol.value =
      exchanges_list.value?.find((el) => el.id == currency_id.value)?.symbol ?? '';
  }
});

// format
const handlePriceInput = (e) => {
  price.value = transformPrice(e.target.value);
};

const addToList = () => {
  if (product_variants.value.find((el) => el.variant.id == product_variant_id.value)) {
    toast('Дубликат', {
      theme: 'auto',
      type: 'error',
      dangerouslyHTMLString: true,
    });
    setTimeout(() => {
      product_variant_id.value = null;
      price.value = null;
      quantity.value = null;
    }, 300);
    return;
  }
  const productObj = product_variants_list.value.find((e) => e.id == product_variant_id.value);

  product_variants.value.push({
    variant: productObj,
    price: price.value,
    quantity: quantity.value,
  });
  product_variant_id.value = null;
  price.value = null;
  quantity.value = null;
};

const deleteListItem = (id) => {
  product_variants.value = product_variants.value.filter((el) => el.variant.id != id);
};

const calculatePrice = computed(() => {
  return product_variants.value.reduce(
    (accumulator, el) => accumulator + el.quantity * el.price,
    0,
  );
});

const calculateCount = computed(() => {
  return product_variants.value.reduce(
    (accumulator, el) => accumulator + parseFloat(el.quantity),
    0,
  );
});
</script>

<template>
  <VDialog
    fullscreen
    :model-value="props.isDialogOpen"
    @update:model-value="handleDialogModelValueUpdate"
  >
    <VCard title="Добавить">
      <DialogCloseBtn variant="text" size="small" @click="handleDialogModelValueUpdate(false)" />
      <PerfectScrollbar :options="{ wheelPropagation: false }">
        <VCardText>
          <VForm ref="refForm" v-model="isFormValid" @submit.prevent="onSubmit">
            <VRow>
              <VCol cols="4">
                <VAutocomplete
                  v-model="batches_id"
                  label="Выберите партию"
                  :items="batches_list"
                  item-title="name"
                  item-value="id"
                  :readonly="status != 'Черновик'"
                  :clearable="status == 'Черновик'"
                />
              </VCol>
              <VCol cols="4">
                <VSelect
                  v-model="currency_id"
                  label="Валюта"
                  :items="exchanges_list"
                  item-title="name"
                  item-value="id"
                  :readonly="status != 'Черновик'"
                  :clearable="status == 'Черновик'"
                />
              </VCol>
              <VCol cols="4">
                <VTextField
                  v-model="exchange_rate"
                  :readonly="currency_id == 3 || status != 'Черновик'"
                  :clearable="status == 'Черновик'"
                  label="Курс"
                  :prefix="rate_symbol"
                  type="text"
                />
              </VCol>

              <VDivider />

              <VCol cols="12">
                <VTable class="text-no-wrap">
                  <thead>
                    <tr>
                      <th style="width: 48px">ID</th>
                      <th>ТОВАР</th>
                      <th>ЦЕНА</th>
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
                      <td>{{ variant.price }} {{ rate_symbol }}</td>
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
                      <td class="text-body-1">Общая цена: {{ calculatePrice }}{{ rate_symbol }}</td>
                      <td class="text-body-1">Общее количество: {{ calculateCount }}</td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tfoot>

                  <Skeleton :count="5" v-show="isFetchingStart && !product_variants.length" />

                  <tfoot v-show="!isFetchingStart && !product_variants.length">
                    <tr>
                      <td colspan="9" class="text-center text-body-1">Нет доступных данных</td>
                    </tr>
                  </tfoot>
                </VTable>
              </VCol>

              <VDivider />

              <template v-if="status == 'Черновик'">
                <VCol cols="4">
                  <VAutocomplete
                    v-model="product_variant_id"
                    label="Выберите товар"
                    :items="product_variants_list"
                    item-title="name"
                    item-value="id"
                    :rules="[]"
                  />
                </VCol>

                <VCol cols="4">
                  <VTextField
                    :value="transformPrice(price)"
                    @input="handlePriceInput"
                    label="Цена"
                    type="number"
                    :rules="[]"
                  />
                </VCol>

                <VCol cols="3">
                  <VTextField v-model="quantity" label="Количество" type="number" :rules="[]" />
                </VCol>
                <VCol cols="1" class="d-flex justify-center align-center">
                  <VIcon
                    size="30"
                    icon="bx-plus"
                    style="color: white; background-color: #4caf50; border-radius: 5px"
                    @click="addToList()"
                  ></VIcon>
                </VCol>
              </template>
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
                class="me-3"
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
