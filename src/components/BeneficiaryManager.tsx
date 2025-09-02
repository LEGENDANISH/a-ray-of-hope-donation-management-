import React, { useState, useEffect } from 'react';
import { Plus, Heart, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { api } from '../lib/api';

interface Beneficiary {
  id: string;
  name: string;
  description?: string;
  contactInfo?: string;
  createdAt: string;
}

export function BeneficiaryManager() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contactInfo: ''
  });

  useEffect(() => {
    loadBeneficiaries();
  }, []);

  const loadBeneficiaries = async () => {
    try {
      const data = await api.getBeneficiaries();
      setBeneficiaries(data);
    } catch (error) {
      console.error('Failed to load beneficiaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        description: formData.description || undefined,
        contactInfo: formData.contactInfo || undefined
      };

      await api.createBeneficiary(data);
      setDialogOpen(false);
      setFormData({ name: '', description: '', contactInfo: '' });
      loadBeneficiaries();
    } catch (error) {
      console.error('Failed to save beneficiary:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Beneficiary Management</h2>
          <p className="text-gray-600">Track and manage people we help</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Beneficiary
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Beneficiary</DialogTitle>
              <DialogDescription>
                Register someone who receives help from our organization
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Full Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Beneficiary's full name"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of their situation or needs"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Contact Information</label>
                <Input
                  value={formData.contactInfo}
                  onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                  placeholder="Phone, address, or other contact details"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Beneficiary</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {beneficiaries.map((beneficiary) => (
          <Card key={beneficiary.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mr-3">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">{beneficiary.name}</CardTitle>
                  <CardDescription>
                    Added {new Date(beneficiary.createdAt).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {beneficiary.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                    <p className="text-sm text-gray-600">{beneficiary.description}</p>
                  </div>
                )}
                {beneficiary.contactInfo && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Contact</h4>
                    <p className="text-sm text-gray-600">{beneficiary.contactInfo}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {beneficiaries.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No beneficiaries yet</h3>
            <p className="text-gray-600 mb-4">
              Start tracking the people you help by adding your first beneficiary
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Beneficiary
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}