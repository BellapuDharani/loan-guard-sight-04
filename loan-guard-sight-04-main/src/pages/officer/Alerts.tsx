import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AlertTriangle, Clock, CheckCircle, Bell } from "lucide-react";

const mockAlerts = [
  {
    id: "A001",
    type: "high_priority",
    title: "Document Verification Failed",
    description: "Loan L003 - Mike Wilson's income proof document could not be verified",
    timestamp: "2 minutes ago",
    status: "unread"
  },
  {
    id: "A002",
    type: "medium_priority",
    title: "Pending Review Required",
    description: "Loan L001 - John Smith's application requires manual review",
    timestamp: "15 minutes ago",
    status: "unread"
  },
  {
    id: "A003",
    type: "low_priority",
    title: "Document Upload Complete",
    description: "Loan L004 - Emma Davis has uploaded all required documents",
    timestamp: "1 hour ago",
    status: "read"
  },
  {
    id: "A004",
    type: "high_priority",
    title: "System Alert",
    description: "Unusual pattern detected in recent applications - review recommended",
    timestamp: "3 hours ago",
    status: "unread"
  }
];

const getAlertIcon = (type: string) => {
  switch (type) {
    case "high_priority":
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case "medium_priority":
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case "low_priority":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    default:
      return <Bell className="w-4 h-4 text-blue-500" />;
  }
};

const getPriorityBadge = (type: string) => {
  switch (type) {
    case "high_priority":
      return <Badge variant="destructive">High Priority</Badge>;
    case "medium_priority":
      return <Badge variant="secondary">Medium Priority</Badge>;
    case "low_priority":
      return <Badge variant="outline">Low Priority</Badge>;
    default:
      return <Badge variant="default">Info</Badge>;
  }
};

export const Alerts = () => {
  const unreadCount = mockAlerts.filter(alert => alert.status === 'unread').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Alerts & Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread alerts` : 'All alerts reviewed'}
            </p>
          </div>
          <Button variant="outline">
            Mark All as Read
          </Button>
        </div>

        {/* Alert Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Requires immediate attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Medium Priority</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">Review when possible</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Unread</CardTitle>
              <Bell className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreadCount}</div>
              <p className="text-xs text-muted-foreground">Pending review</p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border ${
                    alert.status === 'unread' ? 'bg-blue-50/50 border-blue-200' : 'bg-background'
                  }`}
                >
                  <div className="mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{alert.title}</h3>
                      {getPriorityBadge(alert.type)}
                      {alert.status === 'unread' && (
                        <Badge variant="secondary" className="text-xs">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">View</Button>
                    {alert.status === 'unread' && (
                      <Button variant="ghost" size="sm">Mark as Read</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};