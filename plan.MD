## CRM with Automated Kanban Lead Pipeline

### 1. Lead CRM Kanban

Flow:

**Cold Lead → Contacted → Replied → Research → Ready to Call → Call Booked → Won / Lost**

Leads can be added:

* Automatically from email replies
* Manually by the user

When a prospect replies:

* Move them automatically into **Replied**
* Send a **Telegram notification**
* Save the reply
* Run AI research
* Generate company summary, pain points, contact info and suggested call angle
* Move them into **Ready to Call** once prepared

### 2. Project Tracking

When a lead becomes a customer:

**Convert to Project**

Project flow:

**Onboarding → Planning → Building → Review → Changes → Completed**

Track:

* Tasks
* Deadlines
* Progress
* Notes
* Files
* Screenshots/images
* Deliverables
* Customer requests

### 3. Customer Portal

Give customers their own private view where they can:

* See current project stage
* See progress percentage
* View latest updates
* See upcoming milestones
* View uploaded screenshots/files
* Leave comments
* Request changes
* Approve completed work

### 4. OpenCV Gesture Controls

Use Python + OpenCV to control the CRM using hand gestures:

* Point to move the cursor
* Pinch to click
* Pinch and drag Kanban cards
* Swipe between CRM and Projects
* Two fingers to scroll
* Open palm to go back
* Closed fist to pause controls
* Optional gesture to mark tasks complete

Keep gesture detection local and prevent accidental repeated actions.

### 5. Dashboard

Show:

**Sales**

* New replies
* Ready to call
* Calls booked
* Won leads
