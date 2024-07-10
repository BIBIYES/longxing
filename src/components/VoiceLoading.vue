<template>
  <div class="com__box">
    <!-- loading -->
    <div class="loading"></div>

    <!-- 说明：组件名 -->
  </div>
</template>

<style lang="scss" scoped>
.loading {
  width: 3px;
  height: 13px;
  display: inline-block;
  position: relative;
  border-radius: 4px;
  left: -10px;
  color: #333333;
  animation: loading-animation 0.6s linear infinite;
}

@keyframes loading-animation {
  0% {
    box-shadow: 5px -5px, 10px 5px, 15px 0px;
  }

  25% {
    box-shadow: 5px 0px, 10px 0px, 15px 5px;
  }

  50% {
    box-shadow: 5px 5px, 10px -5px, 15px 0px;
  }

  75% {
    box-shadow: 5px 0px, 10px 0px, 15px -5px;
  }

  100% {
    box-shadow: 5px -5px, 10px 5px, 15px 0px;
  }
}
</style>
