<script setup>
import Colors from '@/views/settings/colors.vue';
import Exchange from '@/views/settings/exchange.vue';
import Sizes from '@/views/settings/sizes.vue';
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
