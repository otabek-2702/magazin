<template>
  <span class="animated-number" :style="numberStyle">
    {{ transformPrice(formattedDisplayNumber) }}
  </span>
</template>

<script setup lang="ts">
import { transformPrice } from "@/helpers";
import { ref, watch, computed, onUnmounted } from "vue";

// Define props with TypeScript
interface AnimatedNumberProps {
  number?: number | string;
  duration?: number;
  decimals?: number;
  easing?: keyof typeof easingFunctions;
}

const props = withDefaults(defineProps<AnimatedNumberProps>(), {
  number: 0,
  duration: 1000,
  decimals: 0,
  easing: "easeOutQuad",
});

// Easing functions
const easingFunctions = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => --t * t * t + 1,
};

// Reactive state
const displayNumber = ref(0);
const startValue = ref(0);
const startTime = ref<number | null>(null);
const rafId = ref<number | null>(null);

const formattedDisplayNumber = computed(() => {
  const num = displayNumber.value.toFixed(props.decimals);
  return num;
});

// Optional custom styling
const numberStyle = computed(() => {
  return {
    display: "inline-block",
    transition: "color 0.3s ease",
  };
});

// Animate function using requestAnimationFrame
const animate = (timestamp: number) => {
  if (!startTime.value) startTime.value = timestamp;

  const progress = Math.min((timestamp - startTime.value) / props.duration, 1);

  // Apply selected easing function
  const easingFunction =
    easingFunctions[props.easing] || easingFunctions.easeOutQuad;
  const easedProgress = easingFunction(progress);

  // Interpolate between start and target values
  displayNumber.value =
    startValue.value +
    (Number(props.number) - startValue.value) * easedProgress;

  if (progress < 1) {
    rafId.value = requestAnimationFrame(animate);
  } else {
    // Ensure we end exactly on the target number
    displayNumber.value = Number(props.number);
  }
};

// Watch for number changes and trigger animation
watch(
  () => props.number,
  (newNumber, oldNumber) => {
    // Reset animation
    startValue.value = Number(oldNumber) || 0;
    startTime.value = null;

    // Cancel any existing animation
    if (rafId.value) {
      cancelAnimationFrame(rafId.value);
    }

    // Start new animation
    rafId.value = requestAnimationFrame(animate);
  },
  { immediate: true }
);

// Cleanup to prevent memory leaks
onUnmounted(() => {
  if (rafId.value) {
    cancelAnimationFrame(rafId.value);
  }
});
</script>

<style scoped>
.animated-number {
  font-variant-numeric: tabular-nums;
}
</style>
