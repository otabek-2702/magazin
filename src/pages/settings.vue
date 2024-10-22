<script setup>
import Colors from '@/views/setting/colors.vue';
import Exchange from '@/views/setting/exchange.vue';
import Sizes from '@/views/setting/sizes.vue';
</script>

<template>
  <section>
    <VRow>
      <VCol cols="6">
        <Sizes />
        <VSpacer class="py-6"/>
        <Exchange />
      </VCol>
      <VCol cols="6">
        <Colors />
      </VCol>
    </VRow>
  </section>
</template>

<style lang="scss"></style>
