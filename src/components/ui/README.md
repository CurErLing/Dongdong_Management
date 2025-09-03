# UI 组件库

这是一个基于 React + TypeScript + Tailwind CSS 的通用 UI 组件库，支持暗黑模式。

## 组件列表

### 基础组件

#### Button 按钮
支持多种变体、尺寸和状态。

```tsx
import { Button } from './ui/Button';

// 基础用法
<Button>默认按钮</Button>

// 不同变体
<Button variant="primary">主要按钮</Button>
<Button variant="success">成功按钮</Button>
<Button variant="warning">警告按钮</Button>
<Button variant="error">错误按钮</Button>
<Button variant="ghost">幽灵按钮</Button>
<Button variant="outline">轮廓按钮</Button>

// 不同尺寸
<Button size="xs">小按钮</Button>
<Button size="md">中等按钮</Button>
<Button size="lg">大按钮</Button>

// 加载状态
<Button loading>加载中</Button>

// 禁用状态
<Button disabled>禁用按钮</Button>

// 带图标
<Button leftIcon={<Icon />}>带图标按钮</Button>
```

#### Input 输入框
支持多种状态和变体。

```tsx
import { Input } from './ui/Input';

// 基础用法
<Input placeholder="请输入内容" />

// 带标签和帮助文本
<Input 
  label="用户名"
  helperText="请输入您的用户名"
  placeholder="用户名"
/>

// 不同状态
<Input error helperText="输入有误" />
<Input success helperText="输入正确" />

// 带图标
<Input 
  leftIcon={<UserIcon />}
  rightIcon={<SearchIcon />}
  placeholder="搜索用户"
/>

// 不同尺寸
<Input size="sm" placeholder="小输入框" />
<Input size="lg" placeholder="大输入框" />
```

#### Card 卡片
支持头部、内容、底部等区域。

```tsx
import { Card, CardHeader, CardContent, CardFooter } from './ui/Card';

<Card>
  <CardHeader>
    <h3>卡片标题</h3>
  </CardHeader>
  <CardContent>
    <p>卡片内容</p>
  </CardContent>
  <CardFooter>
    <Button>操作按钮</Button>
  </CardFooter>
</Card>

// 自定义样式
<Card 
  padding="lg"
  shadow="lg"
  hover
  className="custom-card"
>
  内容
</Card>
```

#### Modal 模态框
支持多种尺寸和配置选项。

```tsx
import { Modal, ModalFooter } from './ui/Modal';

const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="确认操作"
  size="md"
>
  <p>确定要执行此操作吗？</p>
  
  <ModalFooter
    onCancel={() => setIsOpen(false)}
    onConfirm={() => {
      // 执行操作
      setIsOpen(false);
    }}
    confirmText="确定"
    cancelText="取消"
  />
</Modal>
```

#### Alert 提示框
支持不同类型的提示信息。

```tsx
import { Alert } from './ui/Alert';

// 不同类型
<Alert type="info" title="信息提示">
  这是一条信息提示
</Alert>

<Alert type="success" title="成功提示">
  操作成功完成
</Alert>

<Alert type="warning" title="警告提示">
  请注意这个警告
</Alert>

<Alert type="error" title="错误提示">
  操作失败，请重试
</Alert>

// 可关闭
<Alert 
  type="info" 
  closable 
  onClose={() => console.log('关闭提示')}
>
  可关闭的提示
</Alert>
```

#### Badge 标签
支持不同类型的标签显示。

```tsx
import { Badge } from './ui/Badge';

// 不同变体
<Badge variant="default">默认</Badge>
<Badge variant="primary">主要</Badge>
<Badge variant="success">成功</Badge>
<Badge variant="warning">警告</Badge>
<Badge variant="error">错误</Badge>
<Badge variant="outline">轮廓</Badge>

// 不同尺寸
<Badge size="sm">小标签</Badge>
<Badge size="md">中等标签</Badge>
<Badge size="lg">大标签</Badge>
```

#### Select 选择器
支持下拉选择功能。

```tsx
import { Select } from './ui/Select';

const options = [
  { value: 'option1', label: '选项1' },
  { value: 'option2', label: '选项2' },
  { value: 'option3', label: '选项3' },
];

<Select
  options={options}
  value={selectedValue}
  onChange={setSelectedValue}
  placeholder="请选择"
  label="选择选项"
  helperText="请选择一个选项"
/>
```

#### Textarea 文本域
支持多行文本输入。

```tsx
import { Textarea } from './ui/Textarea';

<Textarea
  label="描述"
  placeholder="请输入描述内容"
  rows={4}
  helperText="最多输入500字"
/>
```

#### Checkbox 复选框
支持复选框功能。

```tsx
import { Checkbox } from './ui/Checkbox';

<Checkbox
  label="同意条款"
  helperText="请仔细阅读并同意相关条款"
/>

// 半选状态
<Checkbox
  indeterminate
  label="部分选中"
/>
```

## 样式常量

组件库提供了丰富的样式常量，可以在 `src/constants/styles.ts` 中找到：

- `COLORS`: 颜色系统
- `SPACING`: 间距系统
- `FONT_SIZES`: 字体大小
- `FONT_WEIGHTS`: 字体粗细
- `BORDER_RADIUS`: 边框圆角
- `SHADOWS`: 阴影系统
- `TRANSITIONS`: 过渡动画
- `Z_INDEX`: 层级管理

## 暗黑模式支持

所有组件都支持暗黑模式，会自动根据 `dark` 类名调整样式。

## 自定义样式

所有组件都支持通过 `className` 属性传入自定义样式类名，可以覆盖默认样式。

## 类型安全

所有组件都使用 TypeScript 编写，提供完整的类型定义和智能提示。

## 响应式设计

组件库使用 Tailwind CSS 的响应式类，支持各种屏幕尺寸。

## 无障碍支持

组件库遵循 WAI-ARIA 标准，提供良好的无障碍访问支持。
