
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import pb from '@/lib/pocketbaseClient';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { TrendingUp, Phone, CheckCircle2, Clock } from 'lucide-react';

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const [categories, setCategories] = useState([]);
  const [categoryStats, setCategoryStats] = useState({});
  const [activities, setActivities] = useState([]);
  const [dailyStats, setDailyStats] = useState({ callsToday: 0, totalLeads: 0, conversionRate: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    try {
      const categoriesData = await pb.collection('categories').getFullList({ $autoCancel: false });
      setCategories(categoriesData);

      const stats = {};
      for (const category of categoriesData) {
        const allLeads = await pb.collection('leads').getFullList({
          filter: `category_id = "${category.id}"`,
          $autoCancel: false,
        });

        const calledLeads = allLeads.filter(lead => lead.status === 'Called' || lead.status === 'Interested' || lead.status === 'Follow Up' || lead.status === 'Converted');

        stats[category.id] = {
          total: allLeads.length,
          called: calledLeads.length,
          remaining: allLeads.length - calledLeads.length,
          percentage: allLeads.length > 0 ? Math.round((calledLeads.length / allLeads.length) * 100) : 0,
        };
      }
      setCategoryStats(stats);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const allLeads = await pb.collection('leads').getFullList({ $autoCancel: false });
      const callsToday = allLeads.filter(lead => {
        if (!lead.called_at) return false;
        const calledDate = new Date(lead.called_at);
        return calledDate >= today && calledDate < tomorrow;
      }).length;

      const convertedLeads = allLeads.filter(lead => lead.status === 'Converted').length;
      const conversionRate = allLeads.length > 0 ? Math.round((convertedLeads / allLeads.length) * 100) : 0;

      setDailyStats({
        callsToday,
        totalLeads: allLeads.length,
        conversionRate,
      });

      const recentActivities = await pb.collection('activity').getList(1, 5, {
        sort: '-created',
        expand: 'user_id,lead_id',
        $autoCancel: false,
      });
      setActivities(recentActivities.items);

      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case 'status_changed':
        return <TrendingUp className="w-4 h-4" />;
      case 'note_added':
        return <Clock className="w-4 h-4" />;
      case 'lead_created':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Phone className="w-4 h-4" />;
    }
  };

  const getActivityText = (activity) => {
    const userName = activity.expand?.user_id?.name || 'User';
    const leadName = activity.expand?.lead_id?.business_name || 'Lead';

    switch (activity.action) {
      case 'status_changed':
        return `${userName} changed ${leadName} status to ${activity.details?.new_status}`;
      case 'note_added':
        return `${userName} added a note to ${leadName}`;
      case 'lead_created':
        return `${userName} created ${leadName}`;
      default:
        return `${userName} performed an action`;
    }
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - Lead Management CRM</title>
        <meta name="description" content="View your lead management dashboard" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2" style={{ letterSpacing: '-0.02em' }}>
              Welcome back, {currentUser?.name}
            </h1>
            <p className="text-muted-foreground">Track your leads and team performance</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Calls today</CardTitle>
                <Phone className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold text-foreground">{dailyStats.callsToday}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total leads</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold text-foreground">{dailyStats.totalLeads}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Conversion rate</CardTitle>
                <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold text-foreground">{dailyStats.conversionRate}%</div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold text-foreground mb-4">Categories</h2>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <Skeleton className="h-6 w-32 mb-4" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-2 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map((category, index) => {
                    const stats = categoryStats[category.id] || { total: 0, called: 0, remaining: 0, percentage: 0 };
                    return (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Link to={`/category/${category.id}`}>
                          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer h-full">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-foreground">{category.name}</h3>
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                  <span className="text-2xl">{category.icon || '📊'}</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Total leads</span>
                                  <span className="font-medium text-foreground">{stats.total}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Called</span>
                                  <span className="font-medium text-foreground">{stats.called}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Remaining</span>
                                  <span className="font-medium text-foreground">{stats.remaining}</span>
                                </div>
                                <Progress value={stats.percentage} className="h-2 mt-3" />
                                <p className="text-xs text-muted-foreground text-right">{stats.percentage}% complete</p>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Recent activity</h2>
              <Card>
                <CardContent className="p-6">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-start space-x-3">
                          <Skeleton className="w-8 h-8 rounded-full" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {getActivityIcon(activity.action)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground">{getActivityText(activity)}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(activity.created), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default DashboardPage;
