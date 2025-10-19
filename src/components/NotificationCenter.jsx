/**
 * Notification Center Component for FloWorx
 * Comprehensive notification management interface
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCircle, 
  X, 
  Filter, 
  Search, 
  Settings, 
  MoreVertical,
  AlertTriangle,
  Info,
  Mail,
  Smartphone,
  MessageSquare,
  Zap,
  Clock,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { advancedNotifications } from '@/lib/advancedNotifications';
import { realTimeNotifications } from '@/lib/realTimeNotifications';
import { notificationPreferencesManager } from '@/lib/notificationPreferences';

const NotificationCenter = ({ isOpen, onClose, onNotificationClick }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [preferences, setPreferences] = useState(null);
  const [realtimeStatus, setRealtimeStatus] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [showPreferences, setShowPreferences] = useState(false);

  // Load notifications and preferences
  useEffect(() => {
    if (user && isOpen) {
      loadNotifications();
      loadPreferences();
      initializeRealtime();
    }
  }, [user, isOpen]);

  // Initialize real-time notifications
  const initializeRealtime = useCallback(async () => {
    if (!user) return;

    try {
      const result = await realTimeNotifications.initializeRealTimeNotifications(user.id);
      if (result.success) {
        setRealtimeStatus(true);
        
        // Listen for real-time updates
        const connection = realTimeNotifications.connections.get(user.id);
        if (connection) {
          connection.onMessage = (message) => {
            handleRealtimeMessage(message);
          };
        }
      }
    } catch (error) {
      console.error('Failed to initialize real-time notifications:', error);
    }
  }, [user]);

  // Handle real-time messages
  const handleRealtimeMessage = useCallback((message) => {
    if (message.type === 'notification') {
      setNotifications(prev => [message, ...prev]);
      setUnreadCount(prev => prev + 1);
    } else if (message.type === 'notification_update') {
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === message.notificationId ? { ...notif, ...message.data } : notif
        )
      );
    }
  }, []);

  // Load notifications
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const result = await advancedNotifications.getAdvancedNotificationHistory(user.id, {
        limit: 100,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // Last 30 days
      });

      if (result.success) {
        setNotifications(result.data || []);
        setUnreadCount(result.data?.filter(n => !n.read).length || 0);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load notifications'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load preferences
  const loadPreferences = async () => {
    try {
      const result = await notificationPreferencesManager.getNotificationPreferences(user.id);
      if (result.success) {
        setPreferences(result.data);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await supabase
        .from('notifications_log')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark notification as unread
  const markAsUnread = async (notificationId) => {
    try {
      await supabase
        .from('notifications_log')
        .update({ read: false, read_at: null })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: false } : notif
        )
      );
      setUnreadCount(prev => prev + 1);
    } catch (error) {
      console.error('Failed to mark notification as unread:', error);
    }
  };

  // Acknowledge notification
  const acknowledgeNotification = async (notificationId) => {
    try {
      const result = await realTimeNotifications.acknowledgeNotification(user.id, notificationId);
      if (result.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, acknowledged: true } : notif
          )
        );
        
        toast({
          title: 'Notification Acknowledged',
          description: 'The notification has been acknowledged'
        });
      }
    } catch (error) {
      console.error('Failed to acknowledge notification:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to acknowledge notification'
      });
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await supabase
        .from('notifications_log')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length === 0) return;

      await supabase
        .from('notifications_log')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('read', false);

      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      await supabase
        .from('notifications_log')
        .delete()
        .eq('user_id', user.id);

      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  };

  // Export notifications
  const exportNotifications = async () => {
    try {
      const exportData = {
        notifications: filteredNotifications,
        exportedAt: new Date().toISOString(),
        user: user.id
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notifications_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export notifications:', error);
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    // Filter by type
    if (filter !== 'all' && notification.type !== filter) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const title = notification.data?.template?.title?.toLowerCase() || '';
      const body = notification.data?.template?.body?.toLowerCase() || '';
      const type = notification.type?.toLowerCase() || '';
      
      if (!title.includes(searchLower) && !body.includes(searchLower) && !type.includes(searchLower)) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.sent_at) - new Date(a.sent_at);
    } else if (sortBy === 'oldest') {
      return new Date(a.sent_at) - new Date(b.sent_at);
    } else if (sortBy === 'priority') {
      const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
      return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
    }
    return 0;
  });

  // Get notification icon
  const getNotificationIcon = (type, priority) => {
    const iconMap = {
      email_received: Mail,
      email_processed: CheckCircle,
      workflow_deployed: Zap,
      workflow_failed: AlertTriangle,
      system_alert: AlertTriangle,
      security_alert: AlertTriangle,
      billing_reminder: Bell,
      daily_summary: Info,
      weekly_report: Info
    };

    const Icon = iconMap[type] || Bell;
    return <Icon className="h-4 w-4" />;
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colorMap = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colorMap[priority] || colorMap.normal;
  };

  // Get channel icons
  const getChannelIcons = (channels) => {
    const icons = [];
    if (channels.email) icons.push(<Mail key="email" className="h-3 w-3" />);
    if (channels.push) icons.push(<Smartphone key="push" className="h-3 w-3" />);
    if (channels.sms) icons.push(<MessageSquare key="sms" className="h-3 w-3" />);
    return icons;
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Notification Center</h2>
              <p className="text-sm text-gray-600">
                {unreadCount} unread • {notifications.length} total
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={realtimeStatus ? 'default' : 'secondary'}>
              {realtimeStatus ? 'Live' : 'Offline'}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setShowPreferences(!showPreferences)}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Preferences Panel */}
        <AnimatePresence>
          {showPreferences && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b bg-gray-50 p-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Real-time Notifications</Label>
                  <Switch
                    checked={preferences?.realtime_notifications !== false}
                    onCheckedChange={(checked) => {
                      // Update preferences
                      setPreferences(prev => ({ ...prev, realtime_notifications: checked }));
                    }}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Email Notifications</Label>
                  <Switch
                    checked={preferences?.email_notifications !== false}
                    onCheckedChange={(checked) => {
                      setPreferences(prev => ({ ...prev, email_notifications: checked }));
                    }}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Push Notifications</Label>
                  <Switch
                    checked={preferences?.push_notifications !== false}
                    onCheckedChange={(checked) => {
                      setPreferences(prev => ({ ...prev, push_notifications: checked }));
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="email_received">Emails</SelectItem>
                  <SelectItem value="workflow_deployed">Workflows</SelectItem>
                  <SelectItem value="system_alert">System</SelectItem>
                  <SelectItem value="security_alert">Security</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
              <Button variant="outline" size="sm" onClick={clearAllNotifications}>
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
              <Button variant="outline" size="sm" onClick={exportNotifications}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={loadNotifications}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading notifications...</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Bell className="h-8 w-8 mb-2" />
              <p>No notifications found</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                    notification.read ? 'bg-gray-50' : 'bg-white border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type, notification.priority)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm">
                          {notification.data?.template?.title || 'Notification'}
                        </h3>
                        <Badge className={getPriorityColor(notification.priority)}>
                          {notification.priority}
                        </Badge>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.data?.template?.body || 'No description available'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(notification.sent_at).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          {getChannelIcons(notification.channels || {})}
                        </span>
                        <span className="capitalize">{notification.type}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsUnread(notification.id)}
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                      )}
                      {notification.data?.requiresAcknowledgment && !notification.acknowledged && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => acknowledgeNotification(notification.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NotificationCenter;
