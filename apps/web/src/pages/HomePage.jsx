
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Users, TrendingUp, FileSpreadsheet, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const HomePage = () => {
  const features = [
    {
      icon: Users,
      title: 'Team collaboration',
      description: 'Assign leads to team members and track their progress in real-time',
    },
    {
      icon: TrendingUp,
      title: 'Performance analytics',
      description: 'Monitor call rates, conversion metrics, and team performance',
    },
    {
      icon: FileSpreadsheet,
      title: 'Bulk import',
      description: 'Upload thousands of leads from Excel or CSV files instantly',
    },
    {
      icon: Shield,
      title: 'Role-based access',
      description: 'Admin and team member roles with granular permissions',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Lead Management CRM - Track and convert leads efficiently</title>
        <meta
          name="description"
          content="Professional lead management system for teams. Track calls, manage status, and convert leads faster."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">L</span>
                </div>
                <span className="font-bold text-xl text-foreground">Lead CRM</span>
              </div>
              <Link to="/login">
                <Button>Login</Button>
              </Link>
            </div>
          </div>
        </header>

        <main>
          <section className="py-20 md:py-32">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl mx-auto text-center"
              >
                <h1
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6"
                  style={{ letterSpacing: '-0.02em', textWrap: 'balance' }}
                >
                  Manage leads, track calls, close deals faster
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                  Built for sales teams who need to track thousands of leads across multiple categories. Import from Excel, assign to team members, and monitor progress in real-time.
                </p>
                <Link to="/login">
                  <Button size="lg" className="text-base">
                    Get started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </section>

          <section className="py-20 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground text-center mb-12">
                  Everything you need to manage leads
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Card className="p-6 h-full hover:shadow-lg transition-all duration-200">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                          <feature.icon className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                      For admins
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      Upload leads in bulk, create categories, assign team members, and monitor overall performance. Full control over the entire lead pipeline.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mr-3 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        </div>
                        <span className="text-foreground">Bulk Excel/CSV import</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mr-3 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        </div>
                        <span className="text-foreground">Team performance analytics</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mr-3 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        </div>
                        <span className="text-foreground">Category management</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                      For team members
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      Access your assigned leads, update call status, add notes, and track your daily progress. Simple interface focused on getting calls done.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mr-3 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        </div>
                        <span className="text-foreground">Quick status updates</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mr-3 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        </div>
                        <span className="text-foreground">Call tracking and notes</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mr-3 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        </div>
                        <span className="text-foreground">Daily performance metrics</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-border py-8 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <p className="text-sm text-muted-foreground mb-4 md:mb-0">
                © 2026 Lead CRM. All rights reserved.
              </p>
              <div className="flex items-center space-x-6">
                <span className="text-sm text-muted-foreground">Privacy Policy</span>
                <span className="text-sm text-muted-foreground">Terms of Service</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default HomePage;
