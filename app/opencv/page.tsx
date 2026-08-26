import { ScanEye } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function OpenCvPage() {
  return (
    <AppShell active="/opencv">
      <ComingSoon
        icon={ScanEye}
        title="OpenCV Gesture Controls"
        description="Point to move the cursor, pinch to click and drag cards, swipe between CRM and Projects, two fingers to scroll, open palm to go back, closed fist to pause."
        note="Deliberately built last — it's the hardest part and needs the most hands-on testing, once the rest of the CRM is stable."
      />
    </AppShell>
  );
}
