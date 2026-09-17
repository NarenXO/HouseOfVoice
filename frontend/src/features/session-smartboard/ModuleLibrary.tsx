import { useEffect, useState } from "react";
import ModuleApprovalWorkflow from "./ModuleApprovalWorkflow";

interface ModuleLibraryEntry {
  id: string;
  phoneme: string;
  age_band: string;
  language: string;
  title: string;
  duration_seconds: number;
  narration_audio_url?: string;
  approved: boolean;
}

interface ModuleLibraryListResponse {
  modules: ModuleLibraryEntry[];
  total: number;
  cached: boolean;
}

export default function ModuleLibrary() {
  const [modules, setModules] = useState<ModuleLibraryEntry[]>([]);
  const [filteredModules, setFilteredModules] = useState<ModuleLibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhoneme, setSelectedPhoneme] = useState<string>("all");
  const [selectedAgeBand, setSelectedAgeBand] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");

  const phonemes = ["/r/", "/s/", "/th/", "/b/"];
  const ageBands = ["child-3-5", "child-6-8", "child-9-12", "teen", "adult"];
  const languages = ["en-US", "en-GB", "es-ES"];

  useEffect(() => {
    fetchModules();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [modules, searchQuery, selectedPhoneme, selectedAgeBand, selectedLanguage]);

  const fetchModules = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedPhoneme !== "all") params.append("phoneme", selectedPhoneme);
      if (selectedAgeBand !== "all") params.append("age_band", selectedAgeBand);
      if (selectedLanguage !== "all") params.append("language", selectedLanguage);

      const response = await fetch(
        `http://localhost:8000/api/session/modules?${params.toString()}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch modules");
      }

      const data: ModuleLibraryListResponse = await response.json();
      setModules(data.modules);
      setFilteredModules(data.modules);
      setCached(data.cached);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load modules");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...modules];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (module) =>
          module.title.toLowerCase().includes(query) ||
          module.phoneme.toLowerCase().includes(query) ||
          module.age_band.toLowerCase().includes(query)
      );
    }

    // Apply phoneme filter
    if (selectedPhoneme !== "all") {
      filtered = filtered.filter((module) => module.phoneme === selectedPhoneme);
    }

    // Apply age band filter
    if (selectedAgeBand !== "all") {
      filtered = filtered.filter((module) => module.age_band === selectedAgeBand);
    }

    // Apply language filter
    if (selectedLanguage !== "all") {
      filtered = filtered.filter((module) => module.language === selectedLanguage);
    }

    setFilteredModules(filtered);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchModules();
  };

  const handleGenerateModule = async (phoneme: string) => {
    try {
      const response = await fetch("http://localhost:8000/api/session/modules/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneme,
          age_band: "child-6-8",
          language: "en-US",
          source: "library-admin",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate module");
      }

      const newModule = await response.json();
      // Show approval workflow for the new module
      setShowApprovalWorkflow(true);
      setSelectedModule(newModule);
      
      // Refresh the library
      fetchModules();
    } catch (error) {
      console.error("Error generating module:", error);
      alert("Failed to generate module. Please try again.");
    }
  };

  const [showApprovalWorkflow, setShowApprovalWorkflow] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-indigo-400">Module Library</h1>
              <p className="text-slate-400 mt-1">
                Browse and manage speech therapy training modules
              </p>
            </div>
            <div className="flex items-center gap-4">
              {cached && (
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Cached Data
                </div>
              )}
              <div className="text-slate-400">
                Total: {modules.length} modules
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Search and Filters */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search modules by title, phoneme, or age band..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Phoneme Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Phoneme
              </label>
              <select
                value={selectedPhoneme}
                onChange={(e) => setSelectedPhoneme(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Phonemes</option>
                {phonemes.map((phoneme) => (
                  <option key={phoneme} value={phoneme}>
                    {phoneme}
                  </option>
                ))}
              </select>
            </div>

            {/* Age Band Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Age Band
              </label>
              <select
                value={selectedAgeBand}
                onChange={(e) => setSelectedAgeBand(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Age Bands</option>
                {ageBands.map((band) => (
                  <option key={band} value={band}>
                    {band}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Languages</option>
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quick Generate Buttons */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Generate Procedural Training Modules</h3>
          <p className="text-slate-400 text-sm mb-4">
            Create 30-second procedural animation modules with AI-directed anatomical motion
          </p>
          <div className="flex flex-wrap gap-3">
            {phonemes.map((phoneme) => (
              <button
                key={phoneme}
                onClick={() => handleGenerateModule(phoneme)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg text-white font-medium transition-all"
              >
                Generate {phoneme} Module
              </button>
            ))}
          </div>
        </div>

        {/* Module Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchModules}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredModules.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700">
            <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-white mb-2">No modules found</h3>
            <p className="text-slate-400">
              Try adjusting your filters or generate new modules
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((module) => (
              <div
                key={module.id}
                className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-indigo-500 transition-colors"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {module.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded text-sm font-medium">
                          {module.phoneme}
                        </span>
                        <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-sm">
                          {module.age_band}
                        </span>
                      </div>
                    </div>
                    {module.approved && (
                      <div className="flex items-center gap-1 text-emerald-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Duration:</span>
                      <span className="text-white">{module.duration_seconds}s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Language:</span>
                      <span className="text-white">{module.language}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Audio:</span>
                      <span className={module.narration_audio_url ? "text-emerald-400" : "text-amber-400"}>
                        {module.narration_audio_url ? "Server TTS" : "Browser Fallback"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-colors"
                    >
                      Play Module
                    </button>
                    <button
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approval Workflow Modal */}
      {showApprovalWorkflow && selectedModule && (
        <ModuleApprovalWorkflow
          moduleData={selectedModule}
          onApprove={(approved) => {
            setShowApprovalWorkflow(false);
            setSelectedModule(null);
            if (approved) {
              fetchModules();
            }
          }}
          onClose={() => {
            setShowApprovalWorkflow(false);
            setSelectedModule(null);
          }}
        />
      )}
    </div>
  );
}
