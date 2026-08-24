"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { completeOnboarding } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const steps = ["Academic Info", "USMLE Prep", "Study Prefs", "Matching Prefs"];

export default function OnboardingPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }

    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await completeOnboarding(formData);
    setIsLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      // Force session update to get isOnboarded: true
      await updateSession({ ...session, user: { ...session?.user, isOnboarded: true } });
      router.push("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            {steps.map((s, i) => (
              <span key={i} className={i <= step ? "font-medium text-gray-900" : ""}>{s}</span>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="rounded-lg bg-white p-6 shadow-sm border space-y-6">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Academic Information</h2>
              <div className="space-y-2">
                <Label>University</Label>
                <Input name="academicYear" defaultValue="Alexandria University" disabled />
                <input type="hidden" name="university" value="Alexandria University" />
              </div>
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <select name="academicYear" className="w-full border rounded-md p-2 text-sm" defaultValue="">
                  <option value="" disabled>Select year</option>
                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                  <option>4th Year</option>
                  <option>5th Year</option>
                  <option>Graduate</option>
                </select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">USMLE Preparation</h2>
              <div className="space-y-2">
                <Label>Current USMLE Stage</Label>
                <select name="currentUsmleStage" className="w-full border rounded-md p-2 text-sm" defaultValue="">
                  <option value="" disabled>Select stage</option>
                  <option value="PREPARING_STEP1">Preparing for Step 1</option>
                  <option value="PREPARING_STEP2CK">Preparing for Step 2 CK</option>
                </select>
              </div>
              <p className="text-xs text-gray-500">You can select specific systems/chapters in your profile later.</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Study Preferences</h2>
              <div className="space-y-2">
                <Label>Available Study Hours / Day</Label>
                <Input name="availableHours" type="number" placeholder="e.g., 6" />
              </div>
              <div className="space-y-2">
                <Label>Preferred Study Time</Label>
                <select name="preferredStudyTime" className="w-full border rounded-md p-2 text-sm" defaultValue="">
                  <option value="" disabled>Select time</option>
                  <option>Morning</option>
                  <option>Afternoon</option>
                  <option>Evening</option>
                  <option>Night</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Preferred Study Days</Label>
                <Input name="preferredDays" placeholder="e.g., Weekdays, Weekends, Everyday" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Matching Preferences (Optional)</h2>
              <p className="text-sm text-gray-500">Skip this if you want to set it up later.</p>
              
              <div className="flex items-center space-x-2">
                <Checkbox id="partners" name="interestedInPartners" />
                <Label htmlFor="partners">Interested in Study Partners</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox id="groups" name="interestedInGroups" />
                <Label htmlFor="groups">Interested in Study Groups</Label>
              </div>

              <div className="space-y-2">
                <Label>Gender Preference for Matching</Label>
                <select name="genderPreference" className="w-full border rounded-md p-2 text-sm" defaultValue="">
                  <option value="">No Preference</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Preferred Location Area</Label>
                <Input name="locationPreference" placeholder="e.g., Smouha, Sidi Gaber" />
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            {step > 0 ? (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            ) : (
              <div />
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : step === steps.length - 1 ? "Complete Setup" : "Continue"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}