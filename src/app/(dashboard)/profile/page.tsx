"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/actions/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateProfile(formData);
    setIsLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.success);
      setIsEditing(false);
      router.refresh();
    }
  }

  if (!session?.user) return null;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Profile</h1>
        {!isEditing && (
          <Button variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
        )}
      </div>
      
      {!isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium text-gray-500">Email:</span> {session.user.email}</p>
            <p><span className="font-medium text-gray-500">Role:</span> {session.user.role}</p>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4 rounded-lg bg-white p-6 shadow-sm border">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input name="firstName" defaultValue={session.user.name?.split(" ")[0] || ""} />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input name="lastName" defaultValue={session.user.name?.split(" ")[1] || ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Input name="bio" placeholder="Tell us a little about yourself" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Input name="academicYear" placeholder="e.g., 4th Year" />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <select name="gender" className="w-full border rounded-md p-2 text-sm">
                <option value="">Prefer not to say</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save Changes"}</Button>
          </div>
        </form>
      )}
    </div>
  );
}