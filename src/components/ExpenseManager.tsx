// ExpenseManager.tsx (Frontend - Corrected)
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { formatCurrency, formatDate } from '../lib/utils';
import { api } from '../lib/api';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  campaignId?: string;
  campaign?: { name: string };
  createdAt: string;
}

interface Campaign {
  id: string;
  name: string;
}

export function ExpenseManager() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [error, setError] = useState<string | null>(null); // <-- Added error state
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    campaignId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [expensesData, campaignsData] = await Promise.all([
        api.getExpenses(),
        api.getCampaigns()
      ]);
      setExpenses(expensesData);
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // <-- Clear previous errors
    try {
      const data = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        campaignId: formData.campaignId || undefined
      };

      if (editingExpense) {
        await api.updateExpense(editingExpense.id, data);
      } else {
        await api.createExpense(data);
      }

      setDialogOpen(false);
      setEditingExpense(null);
      setFormData({ description: '', amount: '', category: '', campaignId: '' });
      loadData(); // Reload data after successful operation
    } catch (err) {
      console.error('Failed to save expense:', err);
      // <-- Set error message for user feedback
      setError(err instanceof Error ? err.message : 'An error occurred while saving the expense.');
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      campaignId: expense.campaignId || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        await api.deleteExpense(id);
        loadData();
      } catch (error) {
        console.error('Failed to delete expense:', error);
        // <-- Set error message for user feedback on delete
        setError(error instanceof Error ? error.message : 'An error occurred while deleting the expense.');
      }
    }
  };

  const handleExport = async () => {
    try {
      await api.exportExpenses();
    } catch (error) {
      console.error('Export failed:', error);
      // <-- Set error message for user feedback on export
      setError(error instanceof Error ? error.message : 'Export failed. Please try again.');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expense Management</h2>
          <p className="text-gray-600">Track and manage all expenses</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingExpense(null);
              setFormData({ description: '', amount: '', category: '', campaignId: '' });
              setError(null); // <-- Clear error when closing dialog
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                </DialogTitle>
                <DialogDescription>
                  {editingExpense ? 'Update expense details' : 'Enter expense information'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* <-- Display error message inside dialog if present --> */}
                {error && (
                  <div className="p-2 bg-red-100 text-red-700 rounded-md text-sm">
                    Error: {error}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Expense description"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Amount (₹)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Food, Medical, Education"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Campaign (Optional)</label>
                  <select
                    value={formData.campaignId}
                    onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select campaign</option>
                    {campaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingExpense ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Expenses</CardTitle>
          <CardDescription>
            Total: {formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* <-- Display error message if present --> */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              Error: {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Description</th>
                  <th className="text-left py-2">Category</th>
                  <th className="text-left py-2">Campaign</th>
                  <th className="text-right py-2">Amount</th>
                  <th className="text-right py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">{formatDate(expense.createdAt)}</td>
                    <td className="py-3">{expense.description}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-3">{expense.campaign?.name || '-'}</td>
                    <td className="py-3 text-right font-medium">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(expense)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expenses.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No expenses found. Add your first expense to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}