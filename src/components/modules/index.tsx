import Vue, { VNode, CreateElement } from 'vue'
import { Component, Prop, Emit, Watch } from 'vue-property-decorator'
import { debounce } from 'ts-debounce'
import isNumber from 'is-number'

import '../styles/index.scss'

interface IScopedSlots {
  [key: string]: any
}
interface IBtnMatch {
  [key: string]: any
}

interface IFalsySlot {
  name: string
  value: any
  [key: string]: any
}

interface IBtnsOptions {
  type?: string
  text?: string
  handler: () => void
}

@Component
export default class PDialog extends Vue {
  // 弹窗是否打开
  @Prop({ type: Boolean, default: false }) readonly visible!: boolean

  // 使用内置的按钮进行的自定义按钮布局
  @Prop({ type: undefined || Array, default: undefined }) readonly footerLayout?: undefined | []

  // 自定插槽中的vnode元素在内置按钮中的位置，从1开始
  @Prop({ type: Array, default: () => [] }) readonly position!: number[]

  // 弹窗类型 add：新增，view：查看，edit：编辑
  @Prop({ type: String, default: 'add' }) readonly type!: string

  // 需要渲染的操作按钮
  private operaBtns: VNode[] = []

  // 各种内置的操作按钮
  private cancelBtn = this.createBtnFactory({ text: '取消', handler: this.handleCancel })
  private deleteBtn = this.createBtnFactory({ text: '删除', type: 'danger', handler: this.handleDelete })
  private confirmBtn = this.createBtnFactory({ text: '确认', type: 'primary', handler: this.handleConfirm })
  private submitBtn = this.createBtnFactory({ text: '提交', type: 'primary', handler: this.handleSubmit })
  private saveBtn = this.createBtnFactory({ text: '保存', type: 'primary', handler: this.handleSave })
  private refreshBtn = this.createBtnFactory({ text: '刷新', handler: this.handleRefresh })
  private resetBtn = this.createBtnFactory({ text: '重置', handler: this.handleReset })
  // close事件属于el-dialog内置，为防止冲突，建议使用off作为关闭关键词
  private offBtn = this.createBtnFactory({ text: '关闭', handler: this.handleOff })

  // 监听type的变化
  // footerLayout配置项优先级比type高
  // footerLayout存在，type配置项失效
  @Watch('type', { immediate: true })
  private dialogTypeChange(val: string) {
    if (this.footerLayout && this.footerLayout.length > 0) return
    switch (val) {
      case 'add':
        this.operaBtns = [this.cancelBtn, this.resetBtn, this.submitBtn]
        break
      case 'view':
        this.operaBtns = [this.offBtn]
        break
      case 'viewdel':
        this.operaBtns = [this.offBtn, this.deleteBtn]
        break
      case 'edit':
        this.operaBtns = [this.cancelBtn, this.resetBtn, this.submitBtn]
        break
    }
  }

  // 监听footer-layout变化
  // 优先级最高
  @Watch('footerLayout', { immediate: true })
  private footerLayoutChange(val: string[]) {
    if (!val) return
    const btnMatch: IBtnMatch = {
      cancel: this.cancelBtn,
      delete: this.deleteBtn,
      confirm: this.confirmBtn,
      submit: this.submitBtn,
      save: this.saveBtn,
      refresh: this.refreshBtn,
      reset: this.resetBtn,
      off: this.offBtn
    }
    this.operaBtns = val.map(o => {
      return btnMatch[o]
    }).filter(m => m)
  }

  @Emit('update:visible')
  updateVisible(val: Boolean) {
    if (val) {
      return val
    }
    return !this.visible
  }

  // 按钮工厂
  private createBtnFactory(option: IBtnsOptions) {
    const { type, text, handler } = option
    return this.$createElement('el-button', { attrs: { type }, on: { click: this.createDebounceFn(handler) } }, text)
  }

  // 防抖工厂
  private createDebounceFn(fn: any) {
    return debounce(fn, 300, { isImmediate : true })
  }

  // 取消
  @Emit('cancel')
  private handleCancel() {
    console.log('取消')
    return this.visible }

  // 删除
  @Emit('delete')
  private handleDelete() { return this.visible }

  // 确认
  @Emit('confirm')
  private handleConfirm() { return this.visible }

  // 提交
  @Emit('submit')
  private handleSubmit() { return this.visible }

  // 保存
  @Emit('save')
  private handleSave() { return this.visible }

  // 刷新
  @Emit('refresh')
  private handleRefresh() { return this.visible }

  // 重置
  @Emit('reset')
  private handleReset() { return this.visible }

  // 关闭
  @Emit('off')
  private handleOff() { return this.visible }

  render(h: CreateElement): VNode {
    // 组装插槽及作用域插槽
    const scopedSlots: IScopedSlots = this.$scopedSlots
    const slots: IFalsySlot[] = []
    const customScopedSlots: any = {}
    for (const slot in scopedSlots) {
      // 只是骗element-ui有插槽的，真正的作用域插槽需要在下面自定义
      const falsySlot: IFalsySlot = { name: slot, value: [h('template')] }
      slots.push(falsySlot)

      // scopedSlots[slot]({ abc: 123 }) 对外暴露作用域插槽值
      // 外部的作用域插槽
      const externalScopedSlots: VNode[] = scopedSlots[slot]()
      let singleScopedSlots: VNode[] = []
      if (slot === 'footer') {
        // 主要是为了解决vnode无法深拷贝，
        // 在不深拷贝的情况下改变this.operaBtns会无限循环
        singleScopedSlots = this.operaBtns.concat([])
        // 第一个校验：position数组的长度必须与插槽内节点长度相同，否则就报错不渲染
        if (this.position.length === 0) {
          singleScopedSlots = singleScopedSlots.concat(externalScopedSlots)
        } else if (this.$slots.footer && (this.$slots.footer as VNode[]).length === this.position.length) {
          this.position.forEach((o, i) => {
            // 第二个校验：position数组内的值必须都为number类型，否则不渲染该位置的元素
            if (isNumber(o)) {
              singleScopedSlots.splice(o - 1, 0, externalScopedSlots[i])
            } else {
              console.error("[position]'s value must be a number")
            }
          })
        } else {
          console.error("slot[footer] VNode's length is not enqual [position]'s length")
        }
      } else {
        singleScopedSlots = externalScopedSlots
      }

      customScopedSlots[slot] = () => {
        return singleScopedSlots
      }
    }

    return (
      <el-dialog
        class="el-dialog-plus-container"
        {...{ props: { ...this.$attrs } }}
        visible={this.visible}
        {...{
          scopedSlots: customScopedSlots
        }}
        {...{ on: { ...this.$listeners, 'update:visible': this.updateVisible } }}
      >
        {slots.map(o => {
          return <template slot={o.name}>{o.value}</template>
        })}
      </el-dialog>
    )
  }
}
