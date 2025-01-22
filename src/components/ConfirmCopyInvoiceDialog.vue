<script setup>
import axios from "@/plugins/axios";
import { toast } from "vue3-toastify";

const props = defineProps({
  id: {
    type: Number,
    required: true,
  },
  endpointTo: {
    type: String,
    required: true,
  },
  endpointFrom: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["fetchDatas", "update:id"]);

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
      `${props.endpointFrom}/${props.id}/${props.endpointTo}`,
      {
        to_branch_id: 1,
      }
    );

    if (response.status === 200) {
      toast("Успешно", {
        type: "success",
      });
      emit("fetchDatas");
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
          @click="onConfirmation"
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
