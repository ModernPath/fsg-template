/**
 * Settings Page
 * Organization and user settings
 */

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, User, Bell, Shield, CreditCard, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const supabase = createClient();

        // Get user
        const {
          data: { user: userData },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!userData) {
          setError("No user found");
          return;
        }

        console.log("⚙️ [Settings] User:", userData.id);
        setUser(userData);

        // Get profile with organization
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(`
            *,
            user_organizations!inner(
              organization_id,
              role,
              organizations(*)
            )
          `)
          .eq("id", userData.id)
          .single();

        if (profileError) {
          console.error("⚙️ [Settings] Error fetching profile:", profileError);
          throw profileError;
        }

        console.log("⚙️ [Settings] Profile:", profileData);

        setProfile(profileData);
        setOrganization(profileData?.user_organizations?.[0]?.organizations);

        console.log("⚙️ [Settings] Organization:", profileData?.user_organizations?.[0]?.organizations);
      } catch (err: any) {
        console.error("⚙️ [Settings] Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No user data found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Manage your organization and account settings
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <TabsTrigger value="organization" className="gap-2">
            <Building2 className="w-4 h-4" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* Organization Settings */}
        <TabsContent value="organization">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Organization Settings
            </h2>

            <div className="space-y-6">
              <div>
                <Label htmlFor="org_name">Organization Name</Label>
                <Input
                  id="org_name"
                  defaultValue={organization?.name}
                  placeholder="Acme M&A Partners"
                />
              </div>

              <div>
                <Label htmlFor="org_website">Website</Label>
                <Input
                  id="org_website"
                  type="url"
                  defaultValue={organization?.website}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <Label htmlFor="org_country">Country</Label>
                <Input
                  id="org_country"
                  defaultValue={organization?.country}
                  placeholder="Finland"
                />
              </div>

              <div>
                <Label htmlFor="org_industry">Industry</Label>
                <Input
                  id="org_industry"
                  defaultValue={organization?.industry}
                  placeholder="M&A Advisory"
                />
              </div>

              <div className="pt-4">
                <Button>Save Changes</Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Profile Settings
            </h2>

            <div className="space-y-6">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  defaultValue={profile?.full_name}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={user?.email}
                  disabled
                  className="bg-gray-50 dark:bg-gray-900"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Email cannot be changed here
                </p>
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  defaultValue={profile?.phone}
                  placeholder="+358 40 123 4567"
                />
              </div>

              <div>
                <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                <Input
                  id="linkedin_url"
                  type="url"
                  defaultValue={profile?.linkedin_url}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div className="pt-4">
                <Button>Save Changes</Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Notification Preferences
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    New Deal Activity
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get notified when there's activity on your deals
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  defaultChecked
                />
              </div>

              <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    NDA Signed
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive alerts when an NDA is signed
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  defaultChecked
                />
              </div>

              <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Payment Received
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get notified when payments are received
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  defaultChecked
                />
              </div>

              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Weekly Summary
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive a weekly summary of your activity
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>

              <div className="pt-4">
                <Button>Save Preferences</Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Security Settings
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  Change Password
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="current_password">Current Password</Label>
                    <Input id="current_password" type="password" />
                  </div>
                  <div>
                    <Label htmlFor="new_password">New Password</Label>
                    <Input id="new_password" type="password" />
                  </div>
                  <div>
                    <Label htmlFor="confirm_password">
                      Confirm New Password
                    </Label>
                    <Input id="confirm_password" type="password" />
                  </div>
                  <Button>Update Password</Button>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                  Two-Factor Authentication
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Add an extra layer of security to your account
                </p>
                <Button variant="outline">Enable 2FA</Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Billing Settings
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                  Current Plan
                </h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Professional
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Unlimited companies and deals
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        €299
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        per month
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                  Payment Method
                </h3>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          •••• •••• •••• 4242
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Expires 12/25
                        </p>
                      </div>
                    </div>
                    <Button variant="outline">Update</Button>
                  </div>
                </div>
              </div>

              <div>
                <Button variant="outline">View Billing History</Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
