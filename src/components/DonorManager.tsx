// DonorManager.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Users, IndianRupee } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { api } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils'; // Import formatting utilities

// Interfaces based on API responses
interface Donor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  _count: { donations: number };
  createdAt: string;
  updatedAt: string;
}

interface Campaign {
  id: string;
  name: string;
  // Add other relevant campaign fields if needed for display
}

export function DonorManager() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]); // State for campaigns
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  // State to track if we are adding a donor or a donation
  const [addingDonor, setAddingDonor] = useState(true);
  // State to track which donor we are donating to
  const [addingDonationFor, setAddingDonationFor] = useState<{ id: string; name: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  // State for donation form data
  const [donationData, setDonationData] = useState({
    amount: '',
    campaignId: '' // Optional campaign association
  });
  const [error, setError] = useState<string | null>(null); // State for general errors
  const [formError, setFormError] = useState<string | null>(null); // State for form-specific errors

  // useEffect to load data when the component mounts
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps // Only run on mount
  }, []); // Empty dependency array ensures this runs once when component mounts

  const loadData = async () => {
    setLoading(true);
    setError(null); // Clear previous general errors
    try {
      // Fetch donors and campaigns concurrently
      const [donorsData, campaignsData] = await Promise.all([
        api.getDonors(),
        api.getCampaigns()
      ]);
      setDonors(donorsData);
      setCampaigns(campaignsData);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load donors or campaigns. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDonorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null); // Clear previous form errors
    try {
      const data = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined
      };

      await api.createDonor(data);
      setDialogOpen(false);
      setFormData({ name: '', email: '', phone: '', address: '' });
      loadData(); // Reload data to show the new donor
    } catch (err) {
      console.error('Failed to save donor:', err);
      setFormError(err instanceof Error ? err.message : 'An error occurred while saving the donor.');
    }
  };

  const handleAddDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null); // Clear previous form errors
    if (!addingDonationFor) return; // Should not happen if UI is correct

    try {
      const amountFloat = parseFloat(donationData.amount);
      if (isNaN(amountFloat) || amountFloat <= 0) {
        throw new Error('Please enter a valid positive amount.');
      }

      const donationPayload = {
        amount: amountFloat,
        donorId: addingDonationFor.id,
        ...(donationData.campaignId && { campaignId: donationData.campaignId }) // Include campaignId only if selected
      };

      await api.createDonation(donationPayload);
      setDialogOpen(false);
      setAddingDonationFor(null);
      setDonationData({ amount: '', campaignId: '' });
      loadData(); // Reload data (backend might update donor counts)
      // Note: Dashboard total might need a separate mechanism to update
    } catch (err) {
      console.error('Failed to save donation:', err);
      setFormError(err instanceof Error ? err.message : 'An error occurred while saving the donation.');
    }
  };

  // Function to open the dialog for adding a donation for a specific donor
  const openDonationDialog = (donor: { id: string; name: string }) => {
    setAddingDonationFor(donor);
    setAddingDonor(false); // Indicate we are adding a donation
    setDonationData({ amount: '', campaignId: '' }); // Reset donation form
    setFormError(null); // Clear previous form errors
    setDialogOpen(true);
  };

  // Function to open the dialog for adding a new donor
  const openAddDonorDialog = () => {
    setAddingDonor(true); // Indicate we are adding a donor
    setFormData({ name: '', email: '', phone: '', address: '' }); // Reset donor form
    setFormError(null); // Clear previous form errors
    setDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false);
    setAddingDonationFor(null); // Reset donation context
    setFormError(null); // Clear form errors
    // Don't reset forms here, as they are reset when opening the dialog
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading donors...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Display general error message if present (outside dialog) */}
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md flex justify-between items-center">
          <span>Error: {error}</span>
          <Button variant="outline" size="sm" onClick={loadData}>Retry</Button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Donor Management</h2>
          <p className="text-gray-600">Manage donor information and relationships</p>
        </div>
        <Button onClick={openAddDonorDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Donor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {donors.map((donor) => (
          <Card key={donor.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{donor.name}</CardTitle>
                    <CardDescription>
                      {donor._count.donations} donation{donor._count.donations !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {donor.email && (
                  <div className="flex items-center text-gray-600">
                    <span className="font-medium mr-2">Email:</span>
                    <span>{donor.email}</span>
                  </div>
                )}
                {donor.phone && (
                  <div className="flex items-center text-gray-600">
                    <span className="font-medium mr-2">Phone:</span>
                    <span>{donor.phone}</span>
                  </div>
                )}
                {donor.address && (
                  <div className="flex items-start text-gray-600">
                    <span className="font-medium mr-2">Address:</span>
                    <span className="flex-1">{donor.address}</span>
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  Added: {formatDate(donor.createdAt)}
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={() => openDonationDialog({ id: donor.id, name: donor.name })} className="w-full">
                  <IndianRupee className="w-4 h-4 mr-2" />
                  Add Donation
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {donors.length === 0 && !error && ( // Only show 'no donors' if there's no general error
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No donors yet</h3>
            <p className="text-gray-600 mb-4">
              Start building relationships by adding your first donor
            </p>
            <Button onClick={openAddDonorDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Donor
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Unified Dialog for Adding Donor or Donation */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          {addingDonor ? (
            <>
              <DialogHeader>
                <DialogTitle>Add New Donor</DialogTitle>
                <DialogDescription>
                  Enter donor information to build relationships
                </DialogDescription>
              </DialogHeader>
              {/* Display form-specific error message inside donor dialog if present */}
              {formError && (
                <div className="p-2 bg-red-100 text-red-700 rounded-md text-sm">
                  Error: {formError}
                </div>
              )}
              <form onSubmit={handleAddDonorSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Full Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Donor's full name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="donor@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Address</label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Full address"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Donor</Button>
                </div>
              </form>
            </>
          ) : (
            addingDonationFor && (
              <>
                <DialogHeader>
                  <DialogTitle>Add Donation for {addingDonationFor.name}</DialogTitle>
                  <DialogDescription>
                    Record a new donation from this donor.
                  </DialogDescription>
                </DialogHeader>
                {/* Display form-specific error message inside donation dialog if present */}
                {formError && (
                  <div className="p-2 bg-red-100 text-red-700 rounded-md text-sm">
                    Error: {formError}
                  </div>
                )}
                <form onSubmit={handleAddDonationSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Amount (₹) *</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        type="number"
                        step="0.01"
                        value={donationData.amount}
                        onChange={(e) => setDonationData({ ...donationData, amount: e.target.value })}
                        placeholder="0.00"
                        required
                        className="pl-10" // Add padding for the icon
                      />
                    </div>
                  </div>
                  {/* Optional: Campaign Selection */}
                  <div>
                    <label className="text-sm font-medium">Campaign (Optional)</label>
                    <select
                      value={donationData.campaignId}
                      onChange={(e) => setDonationData({ ...donationData, campaignId: e.target.value })}
                      className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a campaign</option>
                      {campaigns.map((campaign) => (
                        <option key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={handleDialogClose}>
                      Cancel
                    </Button>
                    <Button type="submit">Record Donation</Button>
                  </div>
                </form>
              </>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}