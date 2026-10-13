/**
 * Recursive prop-editor options (ported from vslide-vue store/editor + Atom editors).
 * Keys match atomName / atomBorder / atomAnimation.
 */

export interface SelectOption {
  label: string
  value: string | number | boolean
}

export interface SpecialField {
  type: 'text' | 'number' | 'switch' | 'color' | 'select' | 'textarea' | 'image'
  options?: SelectOption[]
  tip?: string
}

export interface EditorOption {
  labels?: Record<string, string>
  /** path-regex → label (string keys are matched against full path) */
  specialLabels?: Record<string, string>
  selectOptions?: Record<string, SelectOption[]>
  /** path-regex → field override */
  special?: Record<string, SpecialField>
  /** Keys to skip in recursive walk (handled elsewhere) */
  skipKeys?: string[]
}

const ANIM_ENTER: SelectOption[] = [
  { label: '弹跳', value: 'bounce' },
  { label: '闪光', value: 'flash' },
  { label: '脉冲', value: 'pulse' },
  { label: '橡皮筋', value: 'rubberBand' },
  { label: '抖动', value: 'shake' },
  { label: '摇摆', value: 'swing' },
  { label: 'tada', value: 'tada' },
  { label: '摇晃', value: 'wobble' },
  { label: 'jello', value: 'jello' },
  { label: '心跳', value: 'heartBeat' },
  { label: '弹跳进入', value: 'bounceIn' },
  { label: '左侧弹跳', value: 'bounceInLeft' },
  { label: '右侧弹跳', value: 'bounceInRight' },
  { label: '上方弹跳', value: 'bounceInUp' },
  { label: '下方弹跳', value: 'bounceInDown' },
  { label: '淡入', value: 'fadeIn' },
  { label: '左侧淡入', value: 'fadeInLeft' },
  { label: '右侧淡入', value: 'fadeInRight' },
  { label: '上方淡入', value: 'fadeInDown' },
  { label: '下方淡入', value: 'fadeInUp' },
  { label: '翻转', value: 'flip' },
  { label: '翻转-X', value: 'flipInX' },
  { label: '翻转-Y', value: 'flipInY' },
  { label: '光速', value: 'lightSpeedIn' },
  { label: '旋转', value: 'rotateIn' },
  { label: '左侧浮入', value: 'slideInLeft' },
  { label: '右侧浮入', value: 'slideInRight' },
  { label: '下方浮入', value: 'slideInUp' },
  { label: '上方浮入', value: 'slideInDown' },
  { label: '缩放', value: 'zoomIn' },
  { label: '转入', value: 'rollIn' },
  { label: '无', value: 'none' },
]

const ANIM_LEAVE: SelectOption[] = [
  { label: '弹出', value: 'bounceOut' },
  { label: '淡出', value: 'fadeOut' },
  { label: '淡出-左', value: 'fadeOutLeft' },
  { label: '淡出-右', value: 'fadeOutRight' },
  { label: '淡出-上', value: 'fadeOutUp' },
  { label: '淡出-下', value: 'fadeOutDown' },
  { label: '翻转-X', value: 'flipOutX' },
  { label: '翻转-Y', value: 'flipOutY' },
  { label: '左侧浮出', value: 'slideOutLeft' },
  { label: '右侧浮出', value: 'slideOutRight' },
  { label: '上方浮出', value: 'slideOutUp' },
  { label: '下方浮出', value: 'slideOutDown' },
  { label: '缩放', value: 'zoomOut' },
  { label: '转出', value: 'rollOut' },
  { label: '无', value: 'none' },
]

export const EDITOR_OPTIONS: Record<string, EditorOption> = {
  atomBorder: {
    labels: { width: '宽度', color: '颜色', type: '类型', radius: '圆角' },
    selectOptions: {
      type: [
        { label: '实线', value: 'solid' },
        { label: '----', value: 'dashed' },
        { label: '.....', value: 'dotted' },
      ],
    },
  },
  atomAnimation: {
    labels: { enter: '进入动画', leave: '离开动画', order: '出场次序' },
    selectOptions: { enter: ANIM_ENTER, leave: ANIM_LEAVE },
  },
  'text-shadow': {
    labels: {
      text: '文本',
      color: '颜色',
      fontFamily: '字体',
      fontSize: '字号',
      fontWeight: '字重',
    },
    special: {
      color: { type: 'color' },
      'shadow.color': { type: 'color' },
    },
    specialLabels: {
      'shadow.h': '阴影水平',
      'shadow.v': '阴影垂直',
      'shadow.blur': '阴影模糊',
      'shadow.color': '阴影颜色',
    },
  },
  'text-md': {
    labels: { markdown: 'Markdown', editorId: '编辑器 ID' },
    special: { markdown: { type: 'textarea' } },
    skipKeys: ['editorId'],
  },
  'custom-html': {
    labels: { html: 'HTML', editorId: '编辑器 ID' },
    special: { html: { type: 'textarea' } },
    skipKeys: ['editorId'],
  },
  'simple-table': {
    labels: {
      headerRow: '首行为表头',
      boldHeader: '表头加粗',
      zebra: '斑马纹',
      cellAlign: '对齐',
      headerBackground: '表头背景',
      borderColor: '边框颜色',
      borderWidth: '边框宽度',
    },
    selectOptions: {
      cellAlign: [
        { label: '左对齐', value: 'left' },
        { label: '居中', value: 'center' },
        { label: '右对齐', value: 'right' },
      ],
    },
    special: {
      headerBackground: { type: 'color' },
      borderColor: { type: 'color' },
    },
    skipKeys: ['sheetData', 'nr', 'nc', 'pagination'],
  },
  'single-image': {
    labels: { src: '图片地址' },
    special: { src: { type: 'image' } },
  },
  'image-group': {
    labels: {
      src: '图片列表',
      height: '图片高度',
      gap: '间距',
    },
    special: {
      src: { type: 'image', tip: '多图：属性里可粘贴 JSON 数组，或重新多选插入' },
      height: { type: 'number' },
      gap: { type: 'number' },
    },
  },
  // Shared echart detail keys — used as fallback for all chart atomNames
  echart: {
    labels: {
      animation: '动画',
      text: '标题文字',
      show: '显示',
      left: '左',
      top: '上',
      right: '右',
      bottom: '下',
      width: '线宽',
      type: '类型',
      smooth: '平滑',
      opacity: '透明度',
      symbol: '符号',
      symbolSize: '符号大小',
      clockwise: '顺时针',
      startAngle: '起始角',
      barMaxWidth: '柱最大宽',
      barGap: '柱间距',
      barCategoryGap: '类目间距',
      borderRadius: '圆角',
      showBackground: '柱背景',
    },
    special: {
      'title.text': { type: 'text' },
      'title.textStyle.color': { type: 'color' },
      'simpleLine.lineStyle.color': { type: 'color' },
    },
    specialLabels: {
      'title.text': '标题',
      'title.show': '显示标题',
      'simpleLine.smooth': '平滑曲线',
      'simpleLine.areaStyle.opacity': '面积透明度',
      'simpleLine.lineStyle.width': '线宽',
      'simpleLine.lineStyle.type': '线型',
      'simpleBar.barMaxWidth': '柱最大宽',
      'simplePie.clockwise': '顺时针',
      'simplePie.startAngle': '起始角',
      'simpleScatter.symbol': '符号',
      'simpleScatter.symbolSize': '符号大小',
    },
    selectOptions: {
      type: [
        { label: '实线', value: 'solid' },
        { label: '----', value: 'dashed' },
        { label: '.....', value: 'dotted' },
      ],
      symbol: [
        { label: '圆', value: 'circle' },
        { label: '方', value: 'rect' },
        { label: '菱', value: 'diamond' },
        { label: '三角', value: 'triangle' },
      ],
    },
    skipKeys: ['sheetData', 'nr', 'nc'],
  },
}

export const ANIM_ENTER_OPTIONS = ANIM_ENTER
export const ANIM_LEAVE_OPTIONS = ANIM_LEAVE

export function resolveEditorOption(key: string): EditorOption {
  if (EDITOR_OPTIONS[key]) return EDITOR_OPTIONS[key]!
  // chart atomNames fall back to shared echart option
  if (
    key.startsWith('simple-') ||
    key.startsWith('multi-') ||
    key.startsWith('stack-') ||
    key.startsWith('hor-') ||
    key.includes('bar') ||
    key.includes('line') ||
    key.includes('pie') ||
    key.includes('scatter')
  ) {
    return EDITOR_OPTIONS.echart!
  }
  return {}
}

export function matchSpecialLabel(
  fullPath: string,
  specialLabels?: Record<string, string>,
): string | undefined {
  if (!specialLabels) return undefined
  for (const [pat, label] of Object.entries(specialLabels)) {
    try {
      if (new RegExp(pat).test(fullPath)) return label
    } catch {
      /* ignore bad regex */
    }
  }
  return undefined
}

export function matchSpecial(
  fullPath: string,
  special?: Record<string, SpecialField>,
): SpecialField | undefined {
  if (!special) return undefined
  for (const [pat, field] of Object.entries(special)) {
    try {
      if (new RegExp(pat).test(fullPath)) return field
    } catch {
      /* ignore */
    }
  }
  return undefined
}
