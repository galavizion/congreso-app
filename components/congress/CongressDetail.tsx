export default function CongressDetail({ congressId }: { congressId: string }) {
  const [activeTab, setActiveTab] = useState('general')
  const [congress, setCongress] = useState<any>(null)
  
  // ... tu lógica aquí ...

  return ( // ← ESTO FALTA
    <div>
      {/* Tus 6 tabs aquí */}
    </div>
  )
}