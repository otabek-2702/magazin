<script setup>
import { useGenerateImageVariant } from '@/@core/composable/useGenerateImageVariant'
import girlWithLaptopDark from '@images/illustrations/girl-with-laptop-dark.png'
import girlWithLaptopLight from '@images/illustrations/girl-with-laptop-light.png'

const girlWithLaptop = useGenerateImageVariant(girlWithLaptopLight, girlWithLaptopDark)
</script>

<template>
  <div class="misc-wrapper">
    <ErrorHeader
      error-title="Вы не авторизованы! 🔐"
      error-description="У вас нет разрешения для доступа к этой странице. Вернуться на главную!"
    />

    <!-- 👉 Изображение -->
    <div class="misc-avatar w-100 text-center">
      <VImg
        :src="girlWithLaptop"
        alt="Скоро будет"
        :max-width="500"
        class="mx-auto"
      />
      <VBtn
        to="/"
        class="mt-10"
      >
        Вернуться на главную
      </VBtn>
    </div>
  </div>
</template>


<style lang="scss">
@use "@core/scss/template/pages/misc.scss";
</style>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
