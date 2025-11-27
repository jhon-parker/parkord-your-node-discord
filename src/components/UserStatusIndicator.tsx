interface UserStatusIndicatorProps {
  status: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const UserStatusIndicator = ({ status, size = "sm", className = "" }: UserStatusIndicatorProps) => {
  const sizeClasses = {
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const statusColors: Record<string, string> = {
    online: "bg-green-500",
    idle: "bg-yellow-500",
    dnd: "bg-red-500",
    offline: "bg-gray-500",
  };

  return (
    <div
      className={`rounded-full ${sizeClasses[size]} ${statusColors[status] || statusColors.offline} ${className}`}
    />
  );
};

export default UserStatusIndicator;
