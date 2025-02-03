<script setup>
import axios from "@/plugins/axios";
import { computed, nextTick, watch } from "vue";
import { toast } from "vue3-toastify";

const props = defineProps({
  id: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(["fetchDatas", "update:id"]);

const refForm = ref();
const isFetching = ref(false);
const presentTime = computed(() => new Date().getHours());
const isAgree = ref(false);
const isPasswordVisible = ref(false);
const password = ref();

const updateModelValue = (val) => {
  if (!val) {
    emit("update:id", 0);
    setTimeout(() => {
      nextTick(() => {
        refForm.value?.reset();
        refForm.value?.resetValidation();
      });
      isAgree.value = false;
    }, 300);
  }
};

const onConfirmation = async (e) => {
  e?.preventDefault()
  const valid = refForm.value?.validate();
  if (!valid) return;

  try {
    isFetching.value = true;
    const response = await axios.post(`cashboxes/${props.id}/truncate`, {
      password: password.value,
    });

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
    <VCard class="text-center px-3 pb-6" title="Инкассация">
      <VSpacer />
      <VCardText>
        <VForm ref="refForm">
          <label
            v-if="!isAgree && presentTime < 22"
            class="d-flex flex-wrap justify-center text-error text-h6"
          >
            Внимание: текущее время меньше 22:00. Убедитесь, что вы понимаете
            последствия своих действий. Продолжить?
            <VCheckbox v-model="isAgree" />
          </label>
          <VTextField
            v-else
            :type="isPasswordVisible ? 'text' : 'password'"
            label="Пароль для подтверждения"
            v-model="password"
            autocomplete="off"
            :append-inner-icon="isPasswordVisible ? 'bx-hide' : 'bx-show'"
            @click:append-inner="isPasswordVisible = !isPasswordVisible"
            @keydown.enter="onConfirmation"
            name="password-input-field"
          />
        </VForm>
      </VCardText>

      <VCardActions class="align-center justify-center gap-2 pt-3">
        <VBtn
          type="button"
          variant="elevated"
          color="success"
          @click.prevent="onConfirmation"
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
