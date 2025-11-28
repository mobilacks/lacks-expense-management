'use client';

import { useState } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';

// TODO: Replace with actual data from Supabase
const mockDepartments = [
  {
    id: '1',
    code: 'SALES',
    name: 'Sales',
    isActive: true,
    createdAt: '2025-11-01',
  },
  {
    id: '2',
    code: 'FIN',
    name: 'Finance',
    isActive: true,
    createdAt: '2025-11-01',
  },
  {
    id: '3',
    code: 'IT',
    name: 'Information Technology',
    isActive: true,
    createdAt: '2025-11-01',
  },
  {
    id: '4',
    code: 'HR',
    name: 'Human Resources',
    isActive: true,
    createdAt: '2025-11-01',
  },
];

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState(mockDepartments);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<any>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add API call to create/update department
    console.log('Form submitted:', formData);
    setShowAddModal(false);
    setEditingDepartment(null);
    setFormData({ code: '', name: '' });
  };

  const handleEdit = (department: any) => {
    setEditingDepartment(department);
    setFormData({
      code: department.code,
      name: department.name,
    });
    setShowAddModal(true);
  };

  const toggleDepartmentStatus = (departmentId: string) => {
    // TODO: Add API call to toggle department active status
    setDepartments(departments.map(d => 
      d.id === departmentId ? { ...d, isActive: !d.isActive } : d
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Department Management
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage organizational departments
            </p>
          </div>
          <button
            onClick={() => {
              setEditingDepartment(null);
              setFormData({ code: '', name: '' });
              setShowAddModal(true);
            }}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Department
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Departments</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {departments.length}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {departments.filter(d => d.isActive).length}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Inactive</div>
            <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
              {departments.filter(d => !d.isActive).length}
            </div>
          </div>
        </div>

        {/* Departments Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((department) => (
            <div
              key={department.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {department.name}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      department.isActive
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                      {department.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Code: <span className="font-mono font-semibold">{department.code}</span>
                  </p>
                </div>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                Created: {new Date(department.createdAt).toLocaleDateString()}
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleEdit(department)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-200"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </button>
                <button
                  onClick={() => toggleDepartmentStatus(department.id)}
                  className={`flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg transition-colors duration-200 ${
                    department.isActive
                      ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
                      : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50'
                  }`}
                >
                  {department.isActive ? (
                    <>
                      <ToggleLeft className="w-4 h-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <ToggleRight className="w-4 h-4 mr-2" />
                      Activate
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Department Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                {editingDepartment ? 'Edit Department' : 'Add New Department'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Department Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="IT"
                    disabled={!!editingDepartment}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Short code (e.g., IT, HR, FIN) - cannot be changed after creation
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Department Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Information Technology"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingDepartment(null);
                      setFormData({ code: '', name: '' });
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                  >
                    {editingDepartment ? 'Update Department' : 'Add Department'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
