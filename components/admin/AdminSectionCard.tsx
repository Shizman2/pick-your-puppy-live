interface AdminSectionCardProps {
  title: string;
  children: React.ReactNode;
}

export default function AdminSectionCard({ title, children }: AdminSectionCardProps) {
  return (
    <div className="admin-card">
      <h2 className="admin-card__title">{title}</h2>
      {children}
    </div>
  );
}
