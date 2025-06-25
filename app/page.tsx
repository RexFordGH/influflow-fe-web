'use client';

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Progress,
  Slider,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
  useDisclosure,
} from '@heroui/react';
import { useState } from 'react';

export default function Home() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [switchValue, setSwitchValue] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">HeroUI 组件测试</h1>
          <p className="text-gray-600">这里展示了各种 HeroUI 组件的使用示例</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-4">
            <CardHeader>
              <h3 className="text-lg font-semibold">按钮组件</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              <Button color="primary">主要按钮</Button>
              <Button color="secondary">次要按钮</Button>
              <Button color="success">成功按钮</Button>
              <Button color="warning">警告按钮</Button>
              <Button color="danger">危险按钮</Button>
              <Button variant="ghost">幽灵按钮</Button>
            </CardBody>
          </Card>

          <Card className="p-4">
            <CardHeader>
              <h3 className="text-lg font-semibold">输入组件</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              <Input
                label="用户名"
                placeholder="请输入用户名"
                value={inputValue}
                onValueChange={setInputValue}
              />
              <Input
                label="密码"
                placeholder="请输入密码"
                type="password"
              />
              <Input
                label="邮箱"
                placeholder="请输入邮箱"
                type="email"
                variant="bordered"
              />
            </CardBody>
          </Card>

          <Card className="p-4">
            <CardHeader>
              <h3 className="text-lg font-semibold">开关和滑块</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <span>开关状态</span>
                <Switch
                  isSelected={switchValue}
                  onValueChange={setSwitchValue}
                />
              </div>
              <div>
                <p className="mb-2">滑块值: {sliderValue}</p>
                <Slider
                  size="md"
                  step={10}
                  color="primary"
                  showSteps
                  showTooltip
                  value={sliderValue}
                  onChange={(value) => setSliderValue(value as number)}
                  className="max-w-md"
                />
              </div>
            </CardBody>
          </Card>

          <Card className="p-4">
            <CardHeader>
              <h3 className="text-lg font-semibold">进度条</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              <Progress value={30} className="max-w-md" />
              <Progress value={60} color="success" className="max-w-md" />
              <Progress value={80} color="warning" className="max-w-md" />
              <Progress
                value={sliderValue}
                color="primary"
                className="max-w-md"
              />
            </CardBody>
          </Card>

          <Card className="p-4">
            <CardHeader>
              <h3 className="text-lg font-semibold">标签组件</h3>
            </CardHeader>
            <CardBody>
              <div className="flex flex-wrap gap-2">
                <Chip color="primary">主要标签</Chip>
                <Chip color="secondary">次要标签</Chip>
                <Chip color="success">成功标签</Chip>
                <Chip color="warning">警告标签</Chip>
                <Chip color="danger">危险标签</Chip>
                <Chip variant="bordered">边框标签</Chip>
              </div>
            </CardBody>
          </Card>

          <Card className="p-4">
            <CardHeader>
              <h3 className="text-lg font-semibold">模态框</h3>
            </CardHeader>
            <CardBody>
              <Button onPress={onOpen}>打开模态框</Button>
              <Modal isOpen={isOpen} onClose={onClose}>
                <ModalContent>
                  <ModalHeader className="flex flex-col gap-1">
                    模态框标题
                  </ModalHeader>
                  <ModalBody>
                    <p>这是一个 HeroUI 模态框的示例内容。</p>
                    <p>你可以在这里放置任何内容。</p>
                  </ModalBody>
                  <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                      关闭
                    </Button>
                    <Button color="primary" onPress={onClose}>
                      确认
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            </CardBody>
          </Card>
        </div>

        <Card className="p-4">
          <CardHeader>
            <h3 className="text-lg font-semibold">标签页组件</h3>
          </CardHeader>
          <CardBody>
            <Tabs aria-label="示例标签页">
              <Tab key="photos" title="照片">
                <Card>
                  <CardBody>
                    这里是照片内容。你可以在这里展示图片或相关内容。
                  </CardBody>
                </Card>
              </Tab>
              <Tab key="music" title="音乐">
                <Card>
                  <CardBody>
                    这里是音乐内容。你可以在这里展示音乐播放器或播放列表。
                  </CardBody>
                </Card>
              </Tab>
              <Tab key="videos" title="视频">
                <Card>
                  <CardBody>
                    这里是视频内容。你可以在这里展示视频播放器或视频列表。
                  </CardBody>
                </Card>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>

        <Card className="p-4">
          <CardHeader>
            <h3 className="text-lg font-semibold">表格组件</h3>
          </CardHeader>
          <CardBody>
            <Table aria-label="示例表格">
              <TableHeader>
                <TableColumn>姓名</TableColumn>
                <TableColumn>角色</TableColumn>
                <TableColumn>状态</TableColumn>
              </TableHeader>
              <TableBody>
                <TableRow key="1">
                  <TableCell>张三</TableCell>
                  <TableCell>管理员</TableCell>
                  <TableCell>
                    <Chip color="success" size="sm">
                      活跃
                    </Chip>
                  </TableCell>
                </TableRow>
                <TableRow key="2">
                  <TableCell>李四</TableCell>
                  <TableCell>用户</TableCell>
                  <TableCell>
                    <Chip color="warning" size="sm">
                      暂停
                    </Chip>
                  </TableCell>
                </TableRow>
                <TableRow key="3">
                  <TableCell>王五</TableCell>
                  <TableCell>编辑</TableCell>
                  <TableCell>
                    <Chip color="success" size="sm">
                      活跃
                    </Chip>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <Card className="p-4">
          <CardHeader>
            <h3 className="text-lg font-semibold">综合卡片示例</h3>
          </CardHeader>
          <CardBody>
            <p className="mb-4">当前输入值: {inputValue || '未输入'}</p>
            <p className="mb-4">开关状态: {switchValue ? '开启' : '关闭'}</p>
            <p>滑块值: {sliderValue}</p>
          </CardBody>
          <CardFooter>
            <Button color="primary" className="w-full">
              提交数据
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
