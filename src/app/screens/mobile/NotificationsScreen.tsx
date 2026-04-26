import React from 'react';
import { FileText, Bell, TrendingUp, Calendar, Activity, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

interface Notification {
  id: number;
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  link: string;
}

const notificationGroups = {
  today: [
    {
      id: 1,
      icon: FileText,
      iconColor: 'var(--scolio-primary-blue)',
      title: 'New exam report available',
      description: 'Your exam from April 8, 2026 has been validated by Dr. Ana Martins',
      timestamp: '2 hours ago',
      isRead: false,
      link: '/mobile/exam-detail',
    },
    {
      id: 2,
      icon: Activity,
      iconColor: 'var(--scolio-success-green)',
      title: 'Time to log your wellness',
      description: 'Share how you\'re feeling today to help track your progress',
      timestamp: '5 hours ago',
      isRead: false,
      link: '/mobile/wellness-log',
    },
  ],
  yesterday: [
    {
      id: 3,
      icon: Bell,
      iconColor: 'var(--scolio-warning-amber)',
      title: 'Appointment reminder',
      description: 'You have an upcoming consultation on April 15, 2026 at 10:00 AM',
      timestamp: 'Yesterday, 9:00 AM',
      isRead: true,
      link: '/mobile/home',
    },
    {
      id: 4,
      icon: TrendingUp,
      iconColor: 'var(--scolio-success-green)',
      title: 'Positive evolution detected',
      description: 'Your Cobb angle has decreased by 0.9° compared to your last exam',
      timestamp: 'Yesterday, 2:30 PM',
      isRead: true,
      link: '/mobile/exam-comparison',
    },
  ],
  thisWeek: [
    {
      id: 5,
      icon: FileText,
      iconColor: 'var(--scolio-primary-blue)',
      title: 'Analysis complete',
      description: 'AI analysis has been completed for exam #005',
      timestamp: 'April 5, 2026',
      isRead: true,
      link: '/mobile/exam-detail',
    },
    {
      id: 6,
      icon: Calendar,
      iconColor: 'var(--scolio-warning-amber)',
      title: 'Wellness log reminder',
      description: 'You haven\'t logged your wellness in 3 days',
      timestamp: 'April 4, 2026',
      isRead: true,
      link: '/mobile/wellness-log',
    },
  ],
};

export default function NotificationsScreen() {
  const navigate = useNavigate();

  const handleNotificationClick = (notification: Notification) => {
    navigate(notification.link);
  };

  return (
    <div className="h-screen w-screen max-w-[390px] mx-auto bg-[var(--scolio-page-surface)] flex flex-col overflow-hidden">
      {/* Status Bar Safe Area */}
      <div className="h-11 bg-white" />

      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-[var(--scolio-border-light)]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/mobile/home')} className="p-1 -ml-1">
            <ArrowLeft className="w-6 h-6 text-[var(--scolio-text-primary)]" />
          </button>
          <h2 className="text-[var(--scolio-text-primary)]">Notifications</h2>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {/* Today Section */}
        <section className="mb-2">
          <div className="px-6 py-3 bg-white border-b border-[var(--scolio-border-light)]">
            <h3 className="text-[var(--scolio-text-primary)]">Today</h3>
          </div>
          <div className="bg-white">
            {notificationGroups.today.map((notification, index) => {
              const Icon = notification.icon;
              return (
                <div key={notification.id}>
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className="w-full px-6 py-4 flex items-start gap-4 hover:bg-[var(--scolio-page-surface)] transition-colors text-left"
                  >
                    {/* Unread Indicator */}
                    <div className="pt-2">
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-[var(--scolio-primary-blue)] rounded-full" />
                      )}
                    </div>

                    {/* Icon */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${notification.iconColor}15` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: notification.iconColor }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[var(--scolio-text-primary)] mb-1"
                        style={{
                          fontSize: 'var(--text-body)',
                          fontWeight: notification.isRead ? 'var(--weight-normal)' : 'var(--weight-semibold)',
                        }}
                      >
                        {notification.title}
                      </p>
                      <p
                        className="text-[var(--scolio-text-secondary)] mb-1"
                        style={{ fontSize: 'var(--text-caption)', lineHeight: '1.5' }}
                      >
                        {notification.description}
                      </p>
                      <p
                        className="text-[var(--scolio-neutral-gray)]"
                        style={{ fontSize: 'var(--text-caption)' }}
                      >
                        {notification.timestamp}
                      </p>
                    </div>
                  </button>
                  {index < notificationGroups.today.length - 1 && (
                    <div className="ml-20 h-px bg-[var(--scolio-border-light)]" />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Yesterday Section */}
        <section className="mb-2">
          <div className="px-6 py-3 bg-white border-b border-[var(--scolio-border-light)]">
            <h3 className="text-[var(--scolio-text-primary)]">Yesterday</h3>
          </div>
          <div className="bg-white">
            {notificationGroups.yesterday.map((notification, index) => {
              const Icon = notification.icon;
              return (
                <div key={notification.id}>
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className="w-full px-6 py-4 flex items-start gap-4 hover:bg-[var(--scolio-page-surface)] transition-colors text-left"
                  >
                    {/* Unread Indicator */}
                    <div className="pt-2">
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-[var(--scolio-primary-blue)] rounded-full" />
                      )}
                    </div>

                    {/* Icon */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${notification.iconColor}15` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: notification.iconColor }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[var(--scolio-text-primary)] mb-1"
                        style={{
                          fontSize: 'var(--text-body)',
                          fontWeight: notification.isRead ? 'var(--weight-normal)' : 'var(--weight-semibold)',
                        }}
                      >
                        {notification.title}
                      </p>
                      <p
                        className="text-[var(--scolio-text-secondary)] mb-1"
                        style={{ fontSize: 'var(--text-caption)', lineHeight: '1.5' }}
                      >
                        {notification.description}
                      </p>
                      <p
                        className="text-[var(--scolio-neutral-gray)]"
                        style={{ fontSize: 'var(--text-caption)' }}
                      >
                        {notification.timestamp}
                      </p>
                    </div>
                  </button>
                  {index < notificationGroups.yesterday.length - 1 && (
                    <div className="ml-20 h-px bg-[var(--scolio-border-light)]" />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* This Week Section */}
        <section className="mb-2">
          <div className="px-6 py-3 bg-white border-b border-[var(--scolio-border-light)]">
            <h3 className="text-[var(--scolio-text-primary)]">This week</h3>
          </div>
          <div className="bg-white">
            {notificationGroups.thisWeek.map((notification, index) => {
              const Icon = notification.icon;
              return (
                <div key={notification.id}>
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className="w-full px-6 py-4 flex items-start gap-4 hover:bg-[var(--scolio-page-surface)] transition-colors text-left"
                  >
                    {/* Unread Indicator */}
                    <div className="pt-2">
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-[var(--scolio-primary-blue)] rounded-full" />
                      )}
                    </div>

                    {/* Icon */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${notification.iconColor}15` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: notification.iconColor }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[var(--scolio-text-primary)] mb-1"
                        style={{
                          fontSize: 'var(--text-body)',
                          fontWeight: notification.isRead ? 'var(--weight-normal)' : 'var(--weight-semibold)',
                        }}
                      >
                        {notification.title}
                      </p>
                      <p
                        className="text-[var(--scolio-text-secondary)] mb-1"
                        style={{ fontSize: 'var(--text-caption)', lineHeight: '1.5' }}
                      >
                        {notification.description}
                      </p>
                      <p
                        className="text-[var(--scolio-neutral-gray)]"
                        style={{ fontSize: 'var(--text-caption)' }}
                      >
                        {notification.timestamp}
                      </p>
                    </div>
                  </button>
                  {index < notificationGroups.thisWeek.length - 1 && (
                    <div className="ml-20 h-px bg-[var(--scolio-border-light)]" />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Bottom Navigation */}
      {/* Not included as this is a detail screen */}

      {/* Home Indicator Safe Area */}
      <div className="h-8 bg-[var(--scolio-page-surface)]" />
    </div>
  );
}
