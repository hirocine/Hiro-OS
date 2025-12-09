import { Pencil, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AdminOnly } from '@/components/RoleGuard';
import { TeamMember } from '@/hooks/useTeamMembers';

interface TeamMemberCardProps {
  member: TeamMember;
  onEdit: (member: TeamMember) => void;
  onDelete: (member: TeamMember) => void;
}

export function TeamMemberCard({ member, onEdit, onDelete }: TeamMemberCardProps) {
  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Photo Section */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {member.photo_url ? (
          <img
            src={member.photo_url}
            alt={member.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <span className="text-4xl font-bold text-primary/40">{initials}</span>
          </div>
        )}

        {/* Admin Actions Overlay */}
        <AdminOnly>
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => onEdit(member)}
              className="h-9 w-9"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => onDelete(member)}
              className="h-9 w-9"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </AdminOnly>
      </div>

      {/* Info Section */}
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
            <AvatarImage src={member.photo_url || undefined} alt={member.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{member.name}</h3>
            {member.position && (
              <p className="text-sm text-muted-foreground truncate">{member.position}</p>
            )}
          </div>
        </div>

        {/* Tags */}
        {member.tags && member.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {member.tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-success/10 text-success border-success/20 text-xs"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
