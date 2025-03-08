<template>
  <VDialog
    :model-value="isDialogVisible"
    @update:model-value="updateIsDialogVisible"
    max-width="400"
  >
  <VCard>
    <DialogCloseBtn variant="text" size="small" @click="emit('update:isDialogVisible', false)" />
    <br /><br />
    <VCardText class="text-center pt-12">
      <p class="text-xl font-weight-medium mb-2">
        Вы действительно хотите удалить <span style="color: red;">{{ role.name }}</span>?
      </p>
        <VRow>
          <VCol cols="12" class="d-flex flex-wrap justify-center gap-4">
            <VBtn
              type="button"
              color="error"
              @click="deleteItem"
              :loading="props.isDeleting ?? false"
            >
              Подтвердить
            </VBtn>

            <VBtn color="secondary" variant="tonal" @click="updateIsDialogVisible(false)">
              Отмена
            </VBtn>
          </VCol>
        </VRow>

        <!-- Содержимое диалога -->
      </VCardText>
    </VCard>
  </VDialog>
</template>


<script setup>
import DialogCloseBtn from '@core/components/DialogCloseBtn.vue';

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  role: {
    type: Object,
    required: true,
  },
  isDeleting: {
    required: false,
    type: Boolean,
  },
});

const emit = defineEmits(['update:isDialogVisible']);

const updateIsDialogVisible = (value) => {
  emit('update:isDialogVisible', value);
};
const deleteItem = function () {
  emit('confirm', props.role.id);
};
</script>
