// En-tête de section marketing — label ambre + titre
// Extrait de src/app/page.tsx pour être réutilisé sur d'autres pages publiques

interface SectionHeaderProps {
  label: string;
  title: string;
}

export default function SectionHeader({ label, title }: SectionHeaderProps) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-widest mb-3">{label}</p>
      <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{title}</h2>
    </div>
  );
}
