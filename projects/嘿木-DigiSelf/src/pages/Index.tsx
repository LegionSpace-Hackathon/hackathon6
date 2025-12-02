import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Users, 
  Settings as SettingsIcon,
  Sparkles,
  Shield,
  Clock
} from 'lucide-react';
import { ShadowCard } from '@/components/ShadowCard';
import { CreateShadowDialog } from '@/components/CreateShadowDialog';
import { SettingsPanel } from '@/components/SettingsPanel';
import { ChatInterface } from '@/components/ChatInterface';
import { ShadowIdentity, ShadowSettings } from '@/types/shadow';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'shadow-identities';

const defaultShadows: ShadowIdentity[] = [
  {
    id: '1',
    name: '工作助手',
    description: '专业的工作事务处理助手',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
    personality: '我是一个高效、专业的工作助手。擅长处理邮件回复、会议安排、文档整理等工作事务。回复风格正式而友好，注重细节和准确性。',
    isActive: true,
    settings: {
      enableMode: 'scheduled',
      manualEnabled: false,
      scheduleEnabled: true,
      scheduleStartTime: '09:00',
      scheduleEndTime: '18:00',
      scheduleDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      dataPermissions: {
        chatHistory: true,
        meetings: true,
        documents: true,
        calendar: true,
      },
      autoReply: true,
      replyDelay: 3,
      replyStyle: 'professional',
    },
    createdAt: new Date('2024-01-15'),
    lastActiveAt: new Date(),
  },
  {
    id: '2',
    name: '社交达人',
    description: '活跃的社交媒体管理助手',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
    personality: '我是一个充满活力的社交助手！喜欢用轻松幽默的方式与人交流，擅长社交媒体内容创作、粉丝互动和品牌推广。',
    isActive: false,
    settings: {
      enableMode: 'manual',
      manualEnabled: false,
      scheduleEnabled: false,
      scheduleStartTime: '10:00',
      scheduleEndTime: '22:00',
      scheduleDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      dataPermissions: {
        chatHistory: true,
        meetings: false,
        documents: false,
        calendar: false,
      },
      autoReply: true,
      replyDelay: 2,
      replyStyle: 'friendly',
    },
    createdAt: new Date('2024-01-20'),
  },
];

const reviveShadowDates = (shadow: ShadowIdentity): ShadowIdentity => ({
  ...shadow,
  createdAt: new Date(shadow.createdAt),
  lastActiveAt: shadow.lastActiveAt ? new Date(shadow.lastActiveAt) : undefined,
});

const Index = () => {
  const [shadows, setShadows] = useState<ShadowIdentity[]>(() => {
    if (typeof window === 'undefined') {
      return defaultShadows;
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ShadowIdentity[];
        return parsed.map(reviveShadowDates);
      }
    } catch (error) {
      console.error('Failed to load shadows from storage', error);
    }

    return defaultShadows;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(shadows));
  }, [shadows]);
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [chatInterfaceOpen, setChatInterfaceOpen] = useState(false);
  const [editingShadow, setEditingShadow] = useState<ShadowIdentity | null>(null);
  const [selectedShadow, setSelectedShadow] = useState<ShadowIdentity | null>(null);
  
  const { toast } = useToast();

  const handleCreateShadow = (shadowData: Omit<ShadowIdentity, 'id' | 'createdAt'>) => {
    const newShadow: ShadowIdentity = {
      ...shadowData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    
    setShadows(prev => [...prev, newShadow]);
    toast({
      title: "影子身份创建成功",
      description: `${newShadow.name} 已经准备就绪！`,
    });
  };

  const handleEditShadow = (shadowData: Omit<ShadowIdentity, 'id' | 'createdAt'>) => {
    if (!editingShadow) return;
    
    setShadows(prev => prev.map(shadow => 
      shadow.id === editingShadow.id 
        ? { ...shadowData, id: editingShadow.id, createdAt: editingShadow.createdAt }
        : shadow
    ));
    
    toast({
      title: "影子身份更新成功",
      description: `${shadowData.name} 的信息已更新！`,
    });
    
    setEditingShadow(null);
  };

  const handleDeleteShadow = (shadowId: string) => {
    const shadow = shadows.find(s => s.id === shadowId);
    setShadows(prev => prev.filter(s => s.id !== shadowId));
    
    toast({
      title: "影子身份已删除",
      description: `${shadow?.name} 已被移除`,
      variant: "destructive",
    });
  };

  const handleToggleActive = (shadowId: string) => {
    setShadows(prev => prev.map(shadow => {
      if (shadow.id === shadowId) {
        const newActive = !shadow.isActive;
        const updatedShadow = {
          ...shadow,
          isActive: newActive,
          lastActiveAt: newActive ? new Date() : shadow.lastActiveAt,
        };
        
        toast({
          title: newActive ? "影子已启用" : "影子已关闭",
          description: `${shadow.name} 现在${newActive ? '在线' : '离线'}`,
        });
        
        return updatedShadow;
      }
      return shadow;
    }));
  };

  const handleSaveSettings = (shadowId: string, settings: ShadowSettings) => {
    setShadows(prev => prev.map(shadow => {
      if (shadow.id !== shadowId) return shadow;

      const shouldBeActive = settings.enableMode === 'manual'
        ? settings.manualEnabled
        : settings.scheduleEnabled;

      return {
        ...shadow,
        settings,
        isActive: shouldBeActive,
        lastActiveAt: shouldBeActive ? new Date() : shadow.lastActiveAt,
      };
    }));
    
    const shadow = shadows.find(s => s.id === shadowId);
    toast({
      title: "设置已保存",
      description: `${shadow?.name} 的设置已更新`,
    });
  };

  const handleOpenChat = (shadow: ShadowIdentity) => {
    setSelectedShadow(shadow);
    setChatInterfaceOpen(true);
  };

  const handleOpenSettings = (shadow: ShadowIdentity) => {
    setSelectedShadow(shadow);
    setSettingsPanelOpen(true);
  };

  const handleEditClick = (shadow: ShadowIdentity) => {
    setEditingShadow(shadow);
    setCreateDialogOpen(true);
  };

  const activeShadowsCount = shadows.filter(s => s.isActive).length;
  const totalPermissions = shadows.reduce((acc, shadow) => {
    const permissions = Object.values(shadow.settings.dataPermissions).filter(Boolean).length;
    return acc + permissions;
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
                <img
                  src="/WechatIMG80.jpg"
                  alt="DigiSelf"
                  className="h-10 w-10 rounded-xl object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  DigiSelf管理系统
                </h1>
                <p className="text-sm text-muted-foreground">智能化的个人助手管理平台</p>
              </div>
            </div>
            
            <Button 
              onClick={() => {
                setEditingShadow(null);
                setCreateDialogOpen(true);
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              创建影子
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-purple-100 bg-gradient-to-br from-white to-purple-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Users className="h-5 w-5 text-purple-500" />
                <span>影子总数</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{shadows.length}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {activeShadowsCount} 个在线
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-100 bg-gradient-to-br from-white to-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Clock className="h-5 w-5 text-green-500" />
                <span>活跃状态</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{activeShadowsCount}</div>
              <p className="text-sm text-muted-foreground mt-1">
                正在运行中
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Shield className="h-5 w-5 text-blue-500" />
                <span>数据权限</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{totalPermissions}</div>
              <p className="text-sm text-muted-foreground mt-1">
                已授权访问
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Shadows Grid */}
        {shadows.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-muted rounded-full">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">还没有影子身份</h3>
                  <p className="text-muted-foreground mb-4">
                    创建你的第一个影子身份，开始智能化的个人助手体验
                  </p>
                  <Button 
                    onClick={() => {
                      setEditingShadow(null);
                      setCreateDialogOpen(true);
                    }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    创建第一个影子
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shadows.map((shadow) => (
              <ShadowCard
                key={shadow.id}
                shadow={shadow}
                onEdit={handleEditClick}
                onDelete={handleDeleteShadow}
                onToggleActive={handleToggleActive}
                onOpenChat={handleOpenChat}
                onOpenSettings={handleOpenSettings}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateShadowDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSave={editingShadow ? handleEditShadow : handleCreateShadow}
        editingShadow={editingShadow}
      />

      <SettingsPanel
        open={settingsPanelOpen}
        onOpenChange={setSettingsPanelOpen}
        shadow={selectedShadow}
        onSave={handleSaveSettings}
      />

      <ChatInterface
        open={chatInterfaceOpen}
        onOpenChange={setChatInterfaceOpen}
        shadow={selectedShadow}
        onOpenSettings={handleOpenSettings}
      />
    </div>
  );
};

export default Index;
