<script setup>
import { useGenerateImageVariant } from '@/@core/composable/useGenerateImageVariant'
import pageUnderMaintenance from '@images/pages/misc-under-maintenance.png'
import ErrorHeader from "@core/components/ErrorHeader.vue";

const pageMiscError = useGenerateImageVariant(pageUnderMaintenance, pageUnderMaintenance)
</script>

<template>
  <div class="misc-wrapper">
    <ErrorHeader
      error-title="Доступ запрещён ⚠️"
      error-description="Упс! 😖 Запрашиваемый URL был запрещён."
    />

    <!-- 👉 Изображение -->
    <div class="misc-avatar w-100 text-center">
      <VImg
        :src="pageMiscError"
        alt="Скоро"
        :max-width="500"
        class="mx-auto"
      />
      <VBtn
        to="/"
        class="mt-10"
      >
        Назад на главную
      </VBtn>
    </div>
  </div>
</template>


<style lang="scss">
@use "@core/scss/template/pages/misc.scss";
</style>


