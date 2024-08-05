<template>
  <div class="com__box">
    <!-- loading -->
    <div class="loading"></div>

    <!-- 说明：组件名 -->
  </div>
</template>

<style lang="scss" scoped>
.loading {
  width: 25px;
  height: 25px;
  border: 4px solid transparent; /* 初始边框颜色透明 */
  border-top-color: #333333; /* 初始颜色 */
  border-radius: 100%;
  animation: circle 1s infinite linear;

  @media (prefers-color-scheme: dark) {
    border-top-color: #cccccc; /* 深色模式下的颜色 */
  }
}

@keyframes circle {
  0% {
    transform: rotate(0);
    border-top-color: #333333;
  }
  25% {
    border-top-color: #333333;
    transform: rotate(90deg); /* 旋转到四分之一圆 */
  }
  50% {
    border-top-color: #333333;
    transform: rotate(180deg); /* 旋转到半圆 */
  }
  75% {
    border-top-color: #333333;
    transform: rotate(270deg); /* 旋转到三分之二圆 */
  }
  100% {
    transform: rotate(360deg); /* 完整旋转一圈 */
    border-top-color: #000000; /* 回到起始颜色以形成循环 */
  }
}

@media (prefers-color-scheme: dark) {
  @keyframes circle {
    0% {
      transform: rotate(0);
      border-top-color: #cccccc; /* 调整为深色模式颜色 */
    }
    25% {
      border-top-color: #cccccc;
      transform: rotate(90deg);
    }
    50% {
      border-top-color: #cccccc;
      transform: rotate(180deg);
    }
    75% {
      border-top-color: #cccccc;
      transform: rotate(270deg);
    }
    100% {
      transform: rotate(360deg);
      border-top-color: #aaaaaa; /* 使用不同的深色以形成循环 */
    }
  }
}
</style>
