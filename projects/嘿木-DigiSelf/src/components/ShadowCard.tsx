import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MoreVertical, 
  MessageCircle, 
  Settings, 
  Power, 
  Clock,
  Edit,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ShadowIdentity } from '@/types/shadow';

interface ShadowCardProps {
  shadow: ShadowIdentity;
  onEdit: (shadow: ShadowIdentity) => void;
  onDelete: (shadowId: string) => void;
  onToggleActive: (shadowId: string) => void;
  onOpenChat: (shadow: ShadowIdentity) => void;
  onOpenSettings: (shadow: ShadowIdentity) => void;
}

export const ShadowCard: React.FC<ShadowCardProps> = ({
  shadow,
  onEdit,
  onDelete,
  onToggleActive,
  onOpenChat,
  onOpenSettings
}) => {
  const getStatusBadge = () => {
    if (!shadow.isActive) {
      return <Badge variant="secondary">已关闭</Badge>;
    }
    
    if (shadow.settings.enableMode === 'manual') {
      return <Badge className="bg-green-500 hover:bg-green-600">手动启用</Badge>;
    } else {
      return <Badge className="bg-blue-500 hover:bg-blue-600">定时启用</Badge>;
    }
  };

  const getScheduleInfo = () => {
    if (shadow.settings.enableMode === 'scheduled' && shadow.settings.scheduleEnabled) {
      return `${shadow.settings.scheduleStartTime} - ${shadow.settings.scheduleEndTime}`;
    }
    return null;
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-200 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 ring-2 ring-purple-100">
              <AvatarImage src={shadow.avatar} alt={shadow.name} />
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white font-semibold">
                {shadow.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg font-semibold">{shadow.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{shadow.description}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(shadow)}>
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenSettings(shadow)}>
                <Settings className="h-4 w-4 mr-2" />
                设置
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onToggleActive(shadow.id)}
                className={shadow.isActive ? "text-orange-600" : "text-green-600"}
              >
                <Power className="h-4 w-4 mr-2" />
                {shadow.isActive ? '关闭' : '启用'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(shadow.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 flex-1 flex flex-col">
        <div className="space-y-3 flex-1 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusBadge()}
              {getScheduleInfo() && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {getScheduleInfo()}
                </div>
              )}
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground flex-1">
            <p className="line-clamp-2">{shadow.personality}</p>
          </div>

          <div className="mt-auto space-y-2">
            <div className="flex space-x-2 pt-2">
              <Button 
                size="sm" 
                onClick={() => onOpenChat(shadow)}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                对话
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onOpenSettings(shadow)}
                className="border-purple-200 hover:bg-purple-50"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground pt-1 min-h-[1rem] flex items-center">
              {!shadow.isActive && shadow.lastActiveAt
                ? `最后活跃: ${shadow.lastActiveAt.toLocaleString()}`
                : '\u00A0'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};