import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, User } from 'lucide-react';
import { ShadowIdentity, ShadowSettings } from '@/types/shadow';

interface CreateShadowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (shadow: Omit<ShadowIdentity, 'id' | 'createdAt'>) => void;
  editingShadow?: ShadowIdentity | null;
}

const defaultSettings: ShadowSettings = {
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
};

const createFormData = (shadow?: ShadowIdentity | null) => ({
  name: shadow?.name || '',
  description: shadow?.description || '',
  personality: shadow?.personality || '',
  avatar: shadow?.avatar || '',
  isActive: shadow?.isActive || false,
  settings: shadow
    ? {
        ...shadow.settings,
        dataPermissions: { ...shadow.settings.dataPermissions },
      }
    : {
        ...defaultSettings,
        dataPermissions: { ...defaultSettings.dataPermissions },
      },
});

export const CreateShadowDialog: React.FC<CreateShadowDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  editingShadow
}) => {
  const [formData, setFormData] = useState(() => createFormData(editingShadow));

  useEffect(() => {
    if (!open) return;
    setFormData(createFormData(editingShadow));
  }, [editingShadow, open]);

  const handleSave = () => {
    if (!formData.name.trim()) return;
    
    onSave({
      ...formData,
      lastActiveAt: editingShadow?.lastActiveAt,
    });
    
    // 重置表单
    setFormData(createFormData(null));
    
    onOpenChange(false);
  };

  const handleCancel = () => {
    setFormData(createFormData(editingShadow));
    onOpenChange(false);
  };

  const avatarOptions = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=5',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=6',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {editingShadow ? '编辑影子身份' : '创建新的影子身份'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* 头像选择 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">选择头像</Label>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16 ring-2 ring-purple-100">
                <AvatarImage src={formData.avatar} alt="Avatar" />
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div className="grid grid-cols-6 gap-2">
                {avatarOptions.map((avatar, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, avatar }))}
                    className={`p-1 rounded-lg border-2 transition-colors ${
                      formData.avatar === avatar 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatar} alt={`Avatar ${index + 1}`} />
                      <AvatarFallback>A{index + 1}</AvatarFallback>
                    </Avatar>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">影子名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="给你的影子起个名字"
                className="border-purple-200 focus:border-purple-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">简短描述</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="简单描述这个影子的用途"
                className="border-purple-200 focus:border-purple-500"
              />
            </div>
          </div>

          {/* 性格设定 */}
          <div className="space-y-2">
            <Label htmlFor="personality">性格特征</Label>
            <Textarea
              id="personality"
              value={formData.personality}
              onChange={(e) => setFormData(prev => ({ ...prev, personality: e.target.value }))}
              placeholder="描述这个影子的性格特征、说话风格、专业领域等..."
              rows={4}
              className="border-purple-200 focus:border-purple-500"
            />
          </div>

          {/* 回复风格 */}
          <div className="space-y-2">
            <Label>回复风格</Label>
            <Select
              value={formData.settings.replyStyle}
              onValueChange={(value: 'formal' | 'casual' | 'professional' | 'friendly') =>
                setFormData(prev => ({
                  ...prev,
                  settings: { ...prev.settings, replyStyle: value }
                }))
              }
            >
              <SelectTrigger className="border-purple-200 focus:border-purple-500">
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

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!formData.name.trim()}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {editingShadow ? '保存更改' : '创建影子'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};