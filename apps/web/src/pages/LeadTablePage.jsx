
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import StatusUpdateModal from '@/components/StatusUpdateModal.jsx';
import NotesPanel from '@/components/NotesPanel.jsx';
import UploadModal from '@/components/UploadModal.jsx';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Search, Phone, ExternalLink, MessageCircle, StickyNote, ChevronLeft, ChevronRight, UploadCloud } from 'lucide-react';

const LeadTablePage = () => {
  const { categoryId } = useParams();
  const { currentUser } = useAuth();
  const [category, setCategory] = useState(null);
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedLead, setSelectedLead] = useState(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [notesSheetOpen, setNotesSheetOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const loadCategoryAndLeads = async () => {
    setLoading(true);
    try {
      const categoryData = await pb.collection('categories').getOne(categoryId, { $autoCancel: false });
      setCategory(categoryData);

      const leadsData = await pb.collection('leads').getFullList({
        filter: `category_id = "${categoryId}"`,
        sort: '-created',
        $autoCancel: false,
      });
      setLeads(leadsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategoryAndLeads();
  }, [categoryId]);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter]);

  const filterLeads = () => {
    let filtered = [...leads];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.business_name?.toLowerCase().includes(term) ||
          lead.owner_name?.toLowerCase().includes(term) ||
          lead.city?.toLowerCase().includes(term) ||
          lead.phone_number?.includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
    }

    setFilteredLeads(filtered);
    setCurrentPage(1);
  };

  const handleCheckboxChange = async (lead, checked) => {
    try {
      const newStatus = checked ? 'Called' : 'Not Contacted';
      const updatedLead = await pb.collection('leads').update(
        lead.id,
        {
          status: newStatus,
          called_at: checked ? new Date().toISOString() : null,
        },
        { $autoCancel: false }
      );

      await pb.collection('activity').create(
        {
          user_id: currentUser.id,
          action: 'status_changed',
          lead_id: lead.id,
          details: {
            old_status: lead.status,
            new_status: newStatus,
          },
        },
        { $autoCancel: false }
      );

      setLeads((prev) => prev.map((l) => (l.id === lead.id ? updatedLead : l)));
    } catch (error) {
      console.error('Failed to update lead:', error);
    }
  };

  const handleStatusUpdate = (updatedLead) => {
    setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)));
  };

  const handleNotesUpdate = (updatedLead) => {
    setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Not Contacted': 'bg-muted text-muted-foreground',
      'Called': 'bg-info text-info-foreground',
      'Interested': 'bg-info text-info-foreground',
      'Follow Up': 'bg-warning text-warning-foreground',
      'Converted': 'bg-success text-success-foreground',
      'Rejected': 'bg-destructive text-destructive-foreground',
    };
    return statusConfig[status] || 'bg-muted text-muted-foreground';
  };

  const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredLeads.length / pageSize);

  return (
    <>
      <Helmet>
        <title>{`${category?.name || 'Category'} Leads - Lead Management CRM`}</title>
        <meta name="description" content={`Manage leads for ${category?.name || 'category'}`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2" style={{ letterSpacing: '-0.02em' }}>
                {category?.name || 'Category'} Leads
              </h1>
              <p className="text-muted-foreground">{filteredLeads.length} leads found</p>
            </div>
            
            {currentUser?.role === 'admin' && (
              <Button onClick={() => setUploadModalOpen(true)}>
                <UploadCloud className="w-4 h-4 mr-2" />
                Upload Excel
              </Button>
            )}
          </div>

          <Card className="mb-6 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, city, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-foreground"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-foreground">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Not Contacted">Not Contacted</SelectItem>
                  <SelectItem value="Called">Called</SelectItem>
                  <SelectItem value="Interested">Interested</SelectItem>
                  <SelectItem value="Follow Up">Follow Up</SelectItem>
                  <SelectItem value="Converted">Converted</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={pageSize.toString()} onValueChange={(val) => setPageSize(Number(val))}>
                <SelectTrigger className="text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {loading ? (
            <Card>
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </Card>
          ) : (
            <>
              {filteredLeads.length === 0 ? (
                <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No leads found</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    There are no leads matching your current filters. Try adjusting your search or upload new leads.
                  </p>
                  {currentUser?.role === 'admin' && (
                    <Button variant="outline" onClick={() => setUploadModalOpen(true)}>
                      <UploadCloud className="w-4 h-4 mr-2" />
                      Upload Leads
                    </Button>
                  )}
                </Card>
              ) : (
                <>
                  <div className="hidden md:block">
                    <Card>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Called</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Business</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Owner</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">City</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Reviews</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Phone</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {paginatedLeads.map((lead) => (
                              <tr key={lead.id} className="hover:bg-muted/30 transition-colors duration-200">
                                <td className="px-4 py-3">
                                  <Checkbox
                                    checked={lead.status !== 'Not Contacted'}
                                    onCheckedChange={(checked) => handleCheckboxChange(lead, checked)}
                                  />
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-foreground">{lead.business_name}</td>
                                <td className="px-4 py-3 text-sm text-foreground">{lead.owner_name || '-'}</td>
                                <td className="px-4 py-3 text-sm text-foreground">{lead.city || '-'}</td>
                                <td className="px-4 py-3 text-sm text-foreground">{lead.google_reviews || 0}</td>
                                <td className="px-4 py-3">
                                  <a
                                    href={`tel:${lead.phone_number}`}
                                    className="text-sm text-primary hover:underline flex items-center"
                                  >
                                    <Phone className="w-3 h-3 mr-1" />
                                    {lead.phone_number}
                                  </a>
                                </td>
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => {
                                      setSelectedLead(lead);
                                      setStatusModalOpen(true);
                                    }}
                                  >
                                    <Badge className={getStatusBadge(lead.status)}>{lead.status}</Badge>
                                  </button>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center space-x-2">
                                    {lead.google_profile_link && (
                                      <a
                                        href={lead.google_profile_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 hover:bg-muted rounded-lg transition-colors duration-200"
                                        title="Google Profile"
                                      >
                                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                      </a>
                                    )}
                                    <a
                                      href={`https://wa.me/${lead.phone_number.replace(/\D/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-2 hover:bg-muted rounded-lg transition-colors duration-200"
                                      title="WhatsApp"
                                    >
                                      <MessageCircle className="w-4 h-4 text-muted-foreground" />
                                    </a>
                                    <button
                                      onClick={() => {
                                        setSelectedLead(lead);
                                        setNotesSheetOpen(true);
                                      }}
                                      className="p-2 hover:bg-muted rounded-lg transition-colors duration-200"
                                      title="Notes"
                                    >
                                      <StickyNote className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </div>

                  <div className="md:hidden space-y-4">
                    {paginatedLeads.map((lead) => (
                      <Card key={lead.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              checked={lead.status !== 'Not Contacted'}
                              onCheckedChange={(checked) => handleCheckboxChange(lead, checked)}
                            />
                            <div>
                              <h3 className="font-semibold text-foreground">{lead.business_name}</h3>
                              <p className="text-sm text-muted-foreground">{lead.owner_name || 'No owner'}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              setStatusModalOpen(true);
                            }}
                          >
                            <Badge className={getStatusBadge(lead.status)}>{lead.status}</Badge>
                          </button>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">City</span>
                            <span className="text-foreground">{lead.city || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Reviews</span>
                            <span className="text-foreground">{lead.google_reviews || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Phone</span>
                            <a href={`tel:${lead.phone_number}`} className="text-primary hover:underline">
                              {lead.phone_number}
                            </a>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-border">
                          {lead.google_profile_link && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={lead.google_profile_link} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Profile
                              </a>
                            </Button>
                          )}
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={`https://wa.me/${lead.phone_number.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              WhatsApp
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedLead(lead);
                              setNotesSheetOpen(true);
                            }}
                          >
                            <StickyNote className="w-4 h-4 mr-2" />
                            Notes
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <p className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredLeads.length)} of {filteredLeads.length} leads
                      </p>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-foreground">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>

        <StatusUpdateModal
          open={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          lead={selectedLead}
          onUpdate={handleStatusUpdate}
        />

        <Sheet open={notesSheetOpen} onOpenChange={setNotesSheetOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Notes for {selectedLead?.business_name}</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              {selectedLead && <NotesPanel lead={selectedLead} onUpdate={handleNotesUpdate} />}
            </div>
          </SheetContent>
        </Sheet>

        <UploadModal 
          open={uploadModalOpen} 
          onOpenChange={setUploadModalOpen} 
          categoryId={categoryId}
          onUploadComplete={loadCategoryAndLeads}
        />
      </div>
    </>
  );
};

export default LeadTablePage;
