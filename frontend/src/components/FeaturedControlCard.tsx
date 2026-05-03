import { ComponentType } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

type ControlType = 'curtain' | 'led' | 'camera';

interface FeaturedControlCardProps {
  name: string;
  room: string;
  icon: ComponentType<{ className?: string }>;
  type: ControlType;
  state?: 'open' | 'closed' | boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  loading: boolean;
}

export function FeaturedControlCard({
  name,
  room,
  icon: Icon,
  type,
  state,
  onActivate,
  onDeactivate,
  loading,
}: FeaturedControlCardProps) {
  // Kameran är "aktiv" i UI:t när den tar en bild
  const isActive = type === 'curtain' 
    ? state === 'open' 
    : type === 'camera' 
      ? loading 
      : Boolean(state);

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-secondary/20">
            <Icon className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <CardTitle className="text-sm font-medium">{name}</CardTitle>
            <p className="text-xs text-muted-foreground">{room}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2">
          {/* Vänster knapp: Capture för kamera, Open för gardin, On för LED */}
          <Button
            variant={type === 'camera' ? 'default' : (isActive ? 'default' : 'outline')}
            size="sm"
            onClick={onActivate}
            disabled={loading || (type === 'curtain' && state === 'open')}
            className="flex-1"
          >
            {type === 'camera' ? (loading ? 'Capturing...' : 'Capture') : (type === 'curtain' ? 'Open' : 'On')}
          </Button>

          {/* Höger knapp: Record (Inaktiv), Close för gardin, Off för LED */}
          <Button
            variant={!isActive && type !== 'camera' ? 'default' : 'outline'}
            size="sm"
            onClick={onDeactivate}
            disabled={loading || type === 'camera' || (type === 'curtain' && state === 'closed')}
            className="flex-1"
          >
            {type === 'camera' ? 'Record' : (type === 'curtain' ? 'Close' : 'Off')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}