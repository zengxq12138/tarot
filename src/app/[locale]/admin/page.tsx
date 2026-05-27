"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Shield, Plus, Coins } from "lucide-react";

interface AdminUser {
  user_id: string;
  email: string;
  balance: number;
}

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [rechargeUserId, setRechargeUserId] = useState("");
  const [rechargeAmount, setRechargeAmount] = useState(100);
  const [recharging, setRecharging] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const isAdmin = user?.user_metadata?.is_admin;

  useEffect(() => {
    if (!user || !isAdmin) return;
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, isAdmin]);

  const handleRecharge = async () => {
    if (!rechargeUserId || rechargeAmount <= 0) return;
    setRecharging(true);

    const res = await fetch(`/api/admin/users/${rechargeUserId}/points`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: rechargeAmount }),
    });

    const data = await res.json();
    if (res.ok && data?.success) {
      toast({ title: "充值成功" });
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === rechargeUserId
            ? { ...u, balance: u.balance + rechargeAmount }
            : u
        )
      );
      setDialogOpen(false);
    } else {
      toast({
        title: "充值失败",
        description: data?.error || "未知错误",
        variant: "destructive",
      });
    }
    setRecharging(false);
  };

  if (!user || !isAdmin) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <p className="text-muted-foreground">无访问权限</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-5 h-5 text-purple-400" />
        <h1 className="text-2xl font-bold">用户积分管理</h1>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        </div>
      )}

      <Card className="border-purple-800/30 bg-card/80">
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-purple-800/30 text-sm text-muted-foreground">
                <th className="text-left p-4 font-medium">用户</th>
                <th className="text-right p-4 font-medium">
                  <Coins className="w-4 h-4 inline mr-1" />
                  积分
                </th>
                <th className="text-right p-4 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.user_id}
                  className="border-b border-purple-800/10 hover:bg-purple-900/10"
                >
                  <td className="p-4 text-sm">{u.email}</td>
                  <td className="p-4 text-sm text-right">
                    <span className="font-bold text-amber-400">{u.balance}</span>
                  </td>
                  <td className="p-4 text-right">
                    <Dialog
                      open={dialogOpen && rechargeUserId === u.user_id}
                      onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) setRechargeUserId("");
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRechargeUserId(u.user_id)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          充值
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>充值积分</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>用户</Label>
                            <p className="text-sm text-muted-foreground">{u.email}</p>
                          </div>
                          <div className="space-y-2">
                            <Label>充值数量</Label>
                            <Input
                              type="number"
                              min={1}
                              value={rechargeAmount}
                              onChange={(e) =>
                                setRechargeAmount(Number(e.target.value))
                              }
                            />
                          </div>
                          <Button
                            onClick={handleRecharge}
                            disabled={recharging}
                            className="w-full"
                          >
                            {recharging && (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            确认充值 {rechargeAmount} 积分
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={3}
                    className="p-8 text-center text-muted-foreground"
                  >
                    暂无用户数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
