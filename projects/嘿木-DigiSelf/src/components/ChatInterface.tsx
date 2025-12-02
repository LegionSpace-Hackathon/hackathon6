import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { ShadowIdentity } from '@/types/shadow';

interface ChatInterfaceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shadow: ShadowIdentity | null;
  onOpenSettings: (shadow: ShadowIdentity) => void;
}

const DIFY_CHAT_URL = 'http://hackathon-team4.tongfudun.com/chatbot/Oznqye1UWba4zodi';

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  open,
  onOpenChange,
  shadow,
  onOpenSettings
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const iframeKey = `${shadow?.id ?? 'shadow'}-${open ? 'open' : 'closed'}`;
  const iframeSrc = shadow
    ? `${DIFY_CHAT_URL}${DIFY_CHAT_URL.includes('?') ? '&' : '?'}shadowId=${encodeURIComponent(shadow.id)}`
    : DIFY_CHAT_URL;

  useEffect(() => {
    if (open) {
      setIsMinimized(false);
    }
  }, [open]);

  if (!shadow) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-4xl transition-all duration-300 ${
        isMinimized ? 'h-16' : 'h-[80vh]'
      }`}>
        <DialogHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <DialogTitle className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={shadow.avatar} alt={shadow.name} />
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-sm">
                {shadow.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="font-semibold">{shadow.name}</span>
              <div className="flex items-center space-x-2 mt-1">
                <Badge 
                  variant={shadow.isActive ? "default" : "secondary"}
                  className="text-xs"
                >
                  {shadow.isActive ? '在线' : '离线'}
                </Badge>
                {shadow.settings.autoReply && shadow.isActive && (
                  <Badge variant="outline" className="text-xs">
                    自动回复
                  </Badge>
                )}
              </div>
            </div>
          </DialogTitle>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenSettings(shadow)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
          </div>
        </DialogHeader>

        {!isMinimized && (
          <div className="pt-4">
            <div className="h-[calc(80vh-110px)]">
              <iframe
                key={iframeKey}
                src={iframeSrc}
                title={`${shadow.name} 助手`}
                className="w-full h-full rounded-lg border"
                frameBorder="0"
                allow="microphone"
              >
              </iframe>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};