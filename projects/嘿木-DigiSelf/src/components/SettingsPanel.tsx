import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Clock, 
  Shield, 
  MessageSquare, 
  Calendar,
  FileText,
  Video,
  Settings as SettingsIcon,
  Save
} from 'lucide-react';
import { ShadowIdentity, ShadowSettings } from '@/types/shadow';
import { Checkbox } from '@/components/ui/checkbox';

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shadow: ShadowIdentity | null;
  onSave: (shadowId: string, settings: ShadowSettings) => void;
}

const weekDays = [
  { id: 'monday', label: '周一' },
  { id: 'tuesday', label: '周二' },
  { id: 'wednesday', label: '周三' },
  { id: 'thursday', label: '周四' },
  { id: 'friday', label: '周五' },
  { id: 'saturday', label: '周六' },
  { id: 'sunday', label: '周日' },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  open,
  onOpenChange,
  shadow,
  onSave
}) => {
  const [settings, setSettings] = useState<ShadowSettings>(
    shadow?.settings || {
      enableMode: 'manual',
      manualEnabled: false,
      scheduleEnabled: false,
      scheduleStartTime: '09:00',
      scheduleEndTime: '18:00',
      scheduleDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      dataPermissions: {
        chatHistory: true,
        meetings: false,
        documents: false,
        calendar: false,
      },
      autoReply: true,
      replyDelay: 5,
      replyStyle: 'professional',
    }
  );

  React.useEffect(() => {
    if (shadow?.settings) {
      setSettings(shadow.settings);
    }
  }, [shadow]);

  const handleSave = () => {
    if (shadow) {
      onSave(shadow.id, settings);
      onOpenChange(false);
    }
  };

  const handleDayToggle = (dayId: string, checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      scheduleDays: checked 
        ? [...prev.scheduleDays, dayId]
        : prev.scheduleDays.filter(d => d !== dayId)
    }));
  };

  if (!shadow) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <SettingsIcon className="h-5 w-5" />
            <span>{shadow.name} - 设置</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 启用模式 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Clock className="h-5 w-5 text-purple-500" />
                <span>启用模式</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">手动模式</h4>
                      <p className="text-sm text-muted-foreground">手动控制开关</p>
                    </div>
                    <Switch
                      checked={settings.enableMode === 'manual'}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ 
                          ...prev, 
                          enableMode: checked ? 'manual' : 'scheduled',
                          manualEnabled: checked ? prev.manualEnabled : false
                        }))
                      }
                    />
                  </div>
                  
                  {settings.enableMode === 'manual' && (
                    <div className="ml-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>当前状态</Label>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={settings.manualEnabled}
                            onCheckedChange={(checked) =>
                              setSettings(prev => ({ ...prev, manualEnabled: checked }))
                            }
                          />
                          <Badge variant={settings.manualEnabled ? "default" : "secondary"}>
                            {settings.manualEnabled ? '已启用' : '已关闭'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">定时模式</h4>
                      <p className="text-sm text-muted-foreground">按时间自动启用</p>
                    </div>
                    <Switch
                      checked={settings.enableMode === 'scheduled'}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ 
                          ...prev, 
                          enableMode: checked ? 'scheduled' : 'manual',
                          scheduleEnabled: checked ? prev.scheduleEnabled : false
                        }))
                      }
                    />
                  </div>
                  
                  {settings.enableMode === 'scheduled' && (
                    <div className="ml-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>启用定时</Label>
                        <Switch
                          checked={settings.scheduleEnabled}
                          onCheckedChange={(checked) =>
                            setSettings(prev => ({ ...prev, scheduleEnabled: checked }))
                          }
                        />
                      </div>
                      
                      {settings.scheduleEnabled && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">开始时间</Label>
                              <Input
                                type="time"
                                value={settings.scheduleStartTime}
                                onChange={(e) =>
                                  setSettings(prev => ({ ...prev, scheduleStartTime: e.target.value }))
                                }
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">结束时间</Label>
                              <Input
                                type="time"
                                value={settings.scheduleEndTime}
                                onChange={(e) =>
                                  setSettings(prev => ({ ...prev, scheduleEndTime: e.target.value }))
                                }
                                className="text-sm"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-xs mb-2 block">工作日</Label>
                            <div className="grid grid-cols-4 gap-1">
                              {weekDays.map(day => (
                                <div key={day.id} className="flex items-center space-x-1">
                                  <Checkbox
                                    id={day.id}
                                    checked={settings.scheduleDays.includes(day.id)}
                                    onCheckedChange={(checked) => 
                                      handleDayToggle(day.id, checked as boolean)
                                    }
                                  />
                                  <Label htmlFor={day.id} className="text-xs">
                                    {day.label}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 数据权限 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Shield className="h-5 w-5 text-green-500" />
                <span>数据权限</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="font-medium">聊天记录</p>
                      <p className="text-xs text-muted-foreground">访问历史对话</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.dataPermissions.chatHistory}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        dataPermissions: { ...prev.dataPermissions, chatHistory: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Video className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="font-medium">会议记录</p>
                      <p className="text-xs text-muted-foreground">访问会议内容</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.dataPermissions.meetings}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        dataPermissions: { ...prev.dataPermissions, meetings: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="font-medium">文档资料</p>
                      <p className="text-xs text-muted-foreground">访问文档内容</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.dataPermissions.documents}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        dataPermissions: { ...prev.dataPermissions, documents: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="font-medium">日程安排</p>
                      <p className="text-xs text-muted-foreground">访问日历信息</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.dataPermissions.calendar}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        dataPermissions: { ...prev.dataPermissions, calendar: checked }
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 回复设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                <span>回复设置</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">自动回复</Label>
                  <p className="text-sm text-muted-foreground">启用后将自动代替你回复消息</p>
                </div>
                <Switch
                  checked={settings.autoReply}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, autoReply: checked }))
                  }
                />
              </div>

              {settings.autoReply && (
                <div className="space-y-4 ml-4 p-4 bg-muted/50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>回复延迟 (秒)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="60"
                        value={settings.replyDelay}
                        onChange={(e) =>
                          setSettings(prev => ({ ...prev, replyDelay: parseInt(e.target.value) || 5 }))
                        }
                      />
                    </div>
                    <div>
                      <Label>回复风格</Label>
                      <Select
                        value={settings.replyStyle}
                        onValueChange={(value: 'formal' | 'casual' | 'professional' | 'friendly') =>
                          setSettings(prev => ({ ...prev, replyStyle: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">专业</SelectItem>
                          <SelectItem value="friendly">友好</SelectItem>
                          <SelectItem value="formal">正式</SelectItem>
                          <SelectItem value="casual">随意</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Save className="h-4 w-4 mr-2" />
            保存设置
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};