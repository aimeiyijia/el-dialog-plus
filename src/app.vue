<template>
  <div id="app">
    <div class="opera">
      <el-button type="primary" @click="open">点击弹出</el-button>
    </div>

    <el-dialog-ts
      title="提示"
      :visible.sync="dialogVisible"
      type="edit"
      :position="[1, 2]"
      :draggable="true"
    >
      <el-button>打开</el-button>
      <!-- <template slot="header"></template> -->
      <!-- 建议使用template，必须定义footer作用于插槽，否则就不会渲染 -->
      <template slot="footer">
        <el-button>1</el-button>
        <el-button>5</el-button>
      </template>
    </el-dialog-ts>
  </div>
</template>

<script>
export default {
  name: 'app',
  data() {
    return {
      dialogVisible: false,
    }
  },
  mounted() {},
  methods: {
    open() {
      this.dialogVisible = true
    },
  },
}
</script>
<style lang="scss">
html,
body,
#app,
.opera {
  height: 100%;
}
.opera {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
