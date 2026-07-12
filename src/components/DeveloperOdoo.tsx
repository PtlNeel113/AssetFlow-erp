import React, { useState } from "react";
import { ODOO_MODULE_FILES } from "../mockData";
import { 
  Terminal, 
  Copy, 
  Check, 
  FileCode, 
  Cpu, 
  HelpCircle,
  Database,
  Code2
} from "lucide-react";

export default function DeveloperOdoo() {
  const [activeTab, setActiveTab] = useState<"MANIFEST" | "MODELS" | "VIEWS" | "SECURITY">("MANIFEST");
  const [copied, setCopied] = useState(false);

  const getCode = () => {
    switch (activeTab) {
      case "MANIFEST": return ODOO_MODULE_FILES.MANIFEST.trim();
      case "MODELS": return ODOO_MODULE_FILES.MODELS.trim();
      case "VIEWS": return ODOO_MODULE_FILES.VIEWS.trim();
      case "SECURITY": return ODOO_MODULE_FILES.SECURITY.trim();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fileMeta = {
    MANIFEST: { path: "__manifest__.py", lang: "python", desc: "Odoo module description, dependencies, and file imports load queue." },
    MODELS: { path: "models/asset_allocation.py", lang: "python", desc: "Python class models defining asset database schema and double-allocation integrity constrains." },
    VIEWS: { path: "views/asset_views.xml", lang: "xml", desc: "XML layouts describing standard list views, forms, search cards, and color-coded kanban layouts." },
    SECURITY: { path: "security/ir.model.access.csv", lang: "csv", desc: "Access Control Lists (ACL) mapping reading/writing capabilities to base corporate roles." }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#714B67] tracking-tight">Odoo Developer Workspace</h2>
        <p className="text-xs text-[#6B6675] mt-1">Review native Python/XML Odoo ERP source code components ready for production deployments.</p>
      </div>

      {/* Overview Metadata Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-[#E5E4EA] rounded-xl p-4.5 flex items-start space-x-3.5 shadow-sm">
          <div className="p-2 bg-[#F1E9EE] text-[#714B67] rounded-lg">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase">Architecture Alignment</h4>
            <p className="text-[11px] text-[#6B6675] mt-1 leading-relaxed">Engineered to support <strong>Odoo v17+</strong> Community & Enterprise cores with standard relational mappings.</p>
          </div>
        </div>

        <div className="bg-white border border-[#E5E4EA] rounded-xl p-4.5 flex items-start space-x-3.5 shadow-sm">
          <div className="p-2 bg-[#E1F5F4] text-[#00A09D] rounded-lg">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase">Relational Integrity</h4>
            <p className="text-[11px] text-[#6B6675] mt-1 leading-relaxed">Includes relational constraints (e.g. <code>_check_double_allocation</code>) to block conflicts server-side.</p>
          </div>
        </div>

        <div className="bg-white border border-[#E5E4EA] rounded-xl p-4.5 flex items-start space-x-3.5 shadow-sm">
          <div className="p-2 bg-[#E7F1FA] text-[#3B82C4] rounded-lg">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase">Ready-to-Deploy Package</h4>
            <p className="text-[11px] text-[#6B6675] mt-1 leading-relaxed">Designed as a modular custom addon. Drag files into your Odoo <code>custom_addons</code> path to compile.</p>
          </div>
        </div>
      </div>

      {/* Split Code View Area */}
      <div className="bg-[#1E1E24] border border-gray-800 rounded-xl overflow-hidden shadow-md flex flex-col md:flex-row h-[550px]">
        {/* Left Side: File Explorer */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-800 flex flex-col bg-[#141419]">
          <div className="p-4 border-b border-gray-800 flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Module File explorer</span>
          </div>

          <div className="p-2.5 flex-1 space-y-1.5 overflow-y-auto">
            {(Object.keys(fileMeta) as Array<keyof typeof fileMeta>).map((key) => {
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => { setActiveTab(key); }}
                  className={`w-full text-left p-2.5 rounded-lg text-xs font-mono flex items-center space-x-2.5 transition-colors cursor-pointer ${
                    active 
                      ? "bg-gray-800 text-white" 
                      : "text-gray-400 hover:bg-gray-800/40 hover:text-gray-300"
                  }`}
                >
                  <FileCode className={`w-4 h-4 shrink-0 ${active ? "text-[#00A09D]" : "text-gray-500"}`} />
                  <span className="truncate">{fileMeta[key].path}</span>
                </button>
              );
            })}
          </div>

          {/* Explorer Help card */}
          <div className="p-4 border-t border-gray-800 bg-[#1A1A22]/30 text-[10px] text-gray-400">
            <div className="flex items-center space-x-1.5 mb-1 text-[#D89614]">
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="font-bold">Did you know?</span>
            </div>
            <p className="leading-relaxed">This file system mirrors structured Odoo architectures. Copying these allows native deployment on actual PostgreSQL-backed ERPs.</p>
          </div>
        </div>

        {/* Right Side: Editor Sandbox */}
        <div className="flex-1 flex flex-col bg-[#1E1E24]">
          {/* Top Bar */}
          <div className="px-5 py-3 border-b border-gray-800 bg-[#1A1A22] flex items-center justify-between">
            <div>
              <div className="font-mono text-xs text-white font-bold">{fileMeta[activeTab].path}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{fileMeta[activeTab].desc}</div>
            </div>

            <button
              id={`btn-copy-odoo-${activeTab}`}
              onClick={handleCopy}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold rounded-md cursor-pointer transition-all border border-gray-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Syntax Highlighter Area */}
          <div className="flex-1 overflow-auto p-5 font-mono text-xs text-gray-300 leading-relaxed bg-[#121217]">
            <pre className="whitespace-pre">{getCode()}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
