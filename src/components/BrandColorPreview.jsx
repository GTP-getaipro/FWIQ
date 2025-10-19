import React from 'react';
import { motion } from 'framer-motion';

const BrandColorPreview = () => {
  const colorGroups = [
    {
      name: 'Primary (Sky Blue)',
      colors: [
        { name: '50', value: '#f0f9ff', text: 'slate-800' },
        { name: '100', value: '#e0f2fe', text: 'slate-800' },
        { name: '200', value: '#bae6fd', text: 'slate-800' },
        { name: '300', value: '#7dd3fc', text: 'slate-800' },
        { name: '400', value: '#38bdf8', text: 'slate-800' },
        { name: '500', value: '#0ea5e9', text: 'white' },
        { name: '600', value: '#0284c7', text: 'white' },
        { name: '700', value: '#0369a1', text: 'white' },
        { name: '800', value: '#075985', text: 'white' },
        { name: '900', value: '#0c4a6e', text: 'white' },
      ]
    },
    {
      name: 'Secondary (Slate)',
      colors: [
        { name: '50', value: '#f8fafc', text: 'slate-800' },
        { name: '100', value: '#f1f5f9', text: 'slate-800' },
        { name: '200', value: '#e2e8f0', text: 'slate-800' },
        { name: '300', value: '#cbd5e1', text: 'slate-800' },
        { name: '400', value: '#94a3b8', text: 'slate-800' },
        { name: '500', value: '#64748b', text: 'white' },
        { name: '600', value: '#475569', text: 'white' },
        { name: '700', value: '#334155', text: 'white' },
        { name: '800', value: '#1e293b', text: 'white' },
        { name: '900', value: '#0f172a', text: 'white' },
      ]
    },
    {
      name: 'Success (Emerald)',
      colors: [
        { name: '50', value: '#f0fdf4', text: 'slate-800' },
        { name: '100', value: '#dcfce7', text: 'slate-800' },
        { name: '200', value: '#bbf7d0', text: 'slate-800' },
        { name: '300', value: '#86efac', text: 'slate-800' },
        { name: '400', value: '#4ade80', text: 'slate-800' },
        { name: '500', value: '#22c55e', text: 'white' },
        { name: '600', value: '#16a34a', text: 'white' },
        { name: '700', value: '#15803d', text: 'white' },
        { name: '800', value: '#166534', text: 'white' },
        { name: '900', value: '#14532d', text: 'white' },
      ]
    },
    {
      name: 'Warning (Amber)',
      colors: [
        { name: '50', value: '#fffbeb', text: 'slate-800' },
        { name: '100', value: '#fef3c7', text: 'slate-800' },
        { name: '200', value: '#fde68a', text: 'slate-800' },
        { name: '300', value: '#fcd34d', text: 'slate-800' },
        { name: '400', value: '#fbbf24', text: 'slate-800' },
        { name: '500', value: '#f59e0b', text: 'white' },
        { name: '600', value: '#d97706', text: 'white' },
        { name: '700', value: '#b45309', text: 'white' },
        { name: '800', value: '#92400e', text: 'white' },
        { name: '900', value: '#78350f', text: 'white' },
      ]
    },
    {
      name: 'Error (Red)',
      colors: [
        { name: '50', value: '#fef2f2', text: 'slate-800' },
        { name: '100', value: '#fee2e2', text: 'slate-800' },
        { name: '200', value: '#fecaca', text: 'slate-800' },
        { name: '300', value: '#fca5a5', text: 'slate-800' },
        { name: '400', value: '#f87171', text: 'slate-800' },
        { name: '500', value: '#ef4444', text: 'white' },
        { name: '600', value: '#dc2626', text: 'white' },
        { name: '700', value: '#b91c1c', text: 'white' },
        { name: '800', value: '#991b1b', text: 'white' },
        { name: '900', value: '#7f1d1d', text: 'white' },
      ]
    }
  ];

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent mb-4">
            FloWorx Brand Color Schema
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            A comprehensive color palette designed for modern, accessible, and professional user interfaces.
          </p>
        </motion.div>

        <div className="grid gap-8">
          {colorGroups.map((group, groupIndex) => (
            <motion.div
              key={group.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
            >
              <h2 className="text-xl font-semibold text-slate-800 mb-4">{group.name}</h2>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                {group.colors.map((color, colorIndex) => (
                  <motion.div
                    key={color.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (groupIndex * 0.1) + (colorIndex * 0.02) }}
                    className="text-center"
                  >
                    <div
                      className="w-full h-16 rounded-lg shadow-sm border border-slate-200 flex items-center justify-center mb-2"
                      style={{ backgroundColor: color.value }}
                    >
                      <span className={`text-xs font-medium ${
                        color.text === 'white' ? 'text-white' : 'text-slate-800'
                      }`}>
                        {color.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-mono">{color.value}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Usage Examples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20"
        >
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">Usage Examples</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Buttons */}
            <div>
              <h3 className="text-lg font-medium text-slate-700 mb-4">Buttons</h3>
              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                  Primary Button
                </button>
                <button className="w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                  Secondary Button
                </button>
                <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                  Success Button
                </button>
                <button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                  Warning Button
                </button>
                <button className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                  Error Button
                </button>
              </div>
            </div>

            {/* Status Cards */}
            <div>
              <h3 className="text-lg font-medium text-slate-700 mb-4">Status Cards</h3>
              <div className="space-y-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></div>
                    <span className="text-emerald-800 font-medium">Success Message</span>
                  </div>
                  <p className="text-emerald-700 text-sm mt-2">Your action was completed successfully.</p>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-amber-500 rounded-full mr-3"></div>
                    <span className="text-amber-800 font-medium">Warning Message</span>
                  </div>
                  <p className="text-amber-700 text-sm mt-2">Please review your input before proceeding.</p>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                    <span className="text-red-800 font-medium">Error Message</span>
                  </div>
                  <p className="text-red-700 text-sm mt-2">Something went wrong. Please try again.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BrandColorPreview;
