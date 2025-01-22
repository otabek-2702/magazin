<script setup>
import axios from "@/plugins/axios";
import { computed, nextTick, watch } from "vue";
import { toast } from "vue3-toastify";

const props = defineProps({
  id: {
    type: Number,
    required: true,
  },
  endpoint: {
    type: String,
    required: true,
  },
  invoiceType: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["fetchDatas", "update:id", "openInfoDialog"]);

const isFetching = ref(false);

const updateModelValue = (val) => {
  if (!val) {
    emit("update:id", 0);
  }
};

const onConfirmation = async () => {
  try {
    isFetching.value = true;
    const response = await axios.post(
      `${props.invoiceType}_movement_invoices/${props.id}/${props.endpoint}`
    );

    if (response.status === 200) {
      toast("Успешно", {
        type: "success",
      });
      emit("fetchDatas");
      emit("openInfoDialog", response.data?.invoice?.id);
      updateModelValue(0);
    }
  } catch (error) {
    console.error(error);
    isFetching.value = false;
  }
};
</script>

<template>
  <!-- 👉 Confirm Dialog -->
  <VDialog
    max-width="500"
    :model-value="!!props.id"
    @update:model-value="updateModelValue"
  >
    <VCard class="text-center px-3 pb-6" title="Подтверждение">
      <VSpacer />
      <VCardText class="text-error text-h6">
        Это действие создаст точную копию накладного. Пожалуйста, подтвердите,
        что вы хотите продолжить.
      </VCardText>
      <VCardActions class="align-center justify-center gap-2 pt-3">
        <VBtn
          type="button"
          variant="elevated"
          color="success"
          @click="  "
          :loading="isFetching"
        >
          Подтвердить
        </VBtn>

        <VBtn color="secondary" variant="elevated" @click="updateModelValue(0)">
          Отмена
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
