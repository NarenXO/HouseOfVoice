import { useNavigate } from 'react-router-dom';

export default function SessionHome() {
  const navigate = useNavigate();
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">session-smartboard — placeholder page</h1>
      <p className="text-gray-500 mt-2">Build your feature's UI here. This file and everything else in this folder belongs to you.</p>
      <button
        onClick={() => navigate('/docs')}
        className="mt-4 bg-[#0D9488] text-white px-6 py-3 rounded-lg hover:bg-[#0D9488]/90 transition-colors"
      >
        View Clinical Dashboard
      </button>
    </div>
  );
}
