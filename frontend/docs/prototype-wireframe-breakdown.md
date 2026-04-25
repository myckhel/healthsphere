Here is a structural frontend prototype and wireframe breakdown based on the HealthSphere AI patient journey. 
---

### Screen 1: Receptionist Dashboard (Ingestion & Digitization)

**Target User:** Administrative Staff / Receptionist
**Goal:** Digitize physical records seamlessly.

**Wireframe Layout**

| HealthSphere AI - Reception | [Sync Status: -]              | [User: Admin 01]                |
| :-------------------------- | :---------------------------- | :------------------------------ |
| **Action Panel**            | **OCR Processing View**       | **Structured EHR Output**       |
| [ + New Patient ]           | *Image Preview of Paper Card* | **Patient Name:** Amina Bello   |
| [ Scan Medical Card ]       | `Scanning...`                 | **DOB:** 12/05/1985             |
| [ Upload Photo ]            | `Extracting Text via AI...`   | **Vitals History:** BP 120/80   |
|                             | `Mapping Structure...`        | **Previous Diagnosis:** Malaria |
|                             |                               |                                 |
|                             |                               | [ **Approve & Save to EHR** ]   |

**Component Breakdown:**
* **Scan Interface:** Triggers the device camera or attached scanner to capture the physical medical card.
* **Split-Screen Verification:** The UI displays the raw photo of the handwriting next to the parsed digital data. 
* **Human-in-the-Loop Confirmation:** Because OCR struggles with messy handwriting, the staff member must review the extracted text and click "Approve" before it populates the EHR database.

---

### Screen 2: Patient Triage Kiosk (Intelligent Routing)

**Target User:** Patient (e.g., Amina)
**Goal:** Determine symptoms in native language and route to the correct queue.

**Wireframe Layout**

| [HealthSphere Logo]                                                                                       | Select Language: [English] [Hausa] [Yoruba] [Igbo] |
| :-------------------------------------------------------------------------------------------------------- | :------------------------------------------------- |
| **Chat Interface (Powered by N-ATLAS)**                                                                   |
| **AI Triage Agent:** *Sannu! Menene yake damun ki yau?* (Hello! What is bothering you today?)             |
| **Patient (Amina):** *Ina jin zazzabi da ciwon kai.* (I have a fever and a headache.)                     |
| **AI Triage Agent:** *I'm sorry to hear that. How many days have you had the fever?*                      |
| **Patient (Amina):** *Kwana uku.* (Three days.)                                                           |
|                                                                                                           |
| **System Action:** Flagged for General Practitioner Queue.                                                |
| **AI Triage Agent:** *Thank you. Please take a seat. You are number 4 in the General Practitioner queue.* |
|                                                                                                           |
| [ 🎤 Tap to Speak ]                                                                                        | [ ⌨️ Switch to Keyboard ]                           |

**Component Breakdown:**
* **Language Toggle:** Prominently displayed to allow patients to interact in indigenous dialects.
* **Conversational UI:** Powered by models like N-ATLAS, allowing plain-language interaction instead of complex medical forms.
* **Multimodal Input:** Patients can tap to speak (voice notes) or type, accommodating varying levels of digital literacy.
* **Routing Confirmation:** The system transparently tells the patient which queue they have been assigned to, reducing waiting room confusion.

---

### Screen 3: Physician EMR Dashboard (Ambient Consultation)

**Target User:** Doctor / Clinical Practitioner
**Goal:** Review patient history and conduct the consultation without manual typing.

**Wireframe Layout**

| Patient: Amina Bello                   | Queue Status: On Time                      | [ 🔴 Ambient AI: Listening ] |
| :------------------------------------- | :----------------------------------------- | :-------------------------- |
| **Digitized History (From Reception)** | **Live AI Consultation Notes**             |
| * Past Visits: 3                       | `Patient reports a 3-day fever and...`     |
| * Chronic Conditions: None             | `headache. No reported nausea.`            |
| * Last BP: 120/80                      | `AI noting potential malaria symptoms.`    |
|                                        |                                            |
| **Diagnostic Aids**                    | **Drafted Clinical Note (EHR)**            |
| [ Request Lab Test ]                   | **Subjective:** 3-day fever, headache.     |
| [ Prescribe Medication ]               | **Objective:** Pending physical exam.      |
| [ Escalation Protocol ]                | **Assessment:** Rule out malaria/typhoid.  |
|                                        | **Plan:** [ Cursor Here - Awaiting Input ] |
|                                        |                                            |
|                                        | [ **Review & Sign Chart** ]                |

**Component Breakdown:**
* **Historical Context Pane:** Displays the historical data digitized during Step 1 for immediate review.
* **Ambient AI Indicator:** A clear visual cue (like a pulsing red dot) indicating the advanced voice recognition is actively listening to the physical or virtual consultation.
* **Auto-Generating SOAP Note:** The AI actively extracts medical intelligence and builds the specialty-specific clinical note in real-time, eliminating manual data entry.
* **One-Click Sign-off:** The doctor reviews the auto-generated chart and signs off, saving significant administrative time.

---

### Screen 4: Outreach & Intervention Dashboard 

**Target User:** Remote Nurse / Care Coordinator
**Goal:** Monitor automated follow-ups and intervene for deteriorating patients.

**Wireframe Layout**

| HealthSphere AI - Outreach                             | **Urgent Alerts: 1**                   | Active Follow-ups: 45 |
| :----------------------------------------------------- | :------------------------------------- | :-------------------- |
| **Automated Patient Comms (WhatsApp Log)**             | **Nurse Intervention Queue**           |
| **AI (Day 3):** Hello Amina, has your fever gone down? | ⚠️ **FLAGGED: Amina Bello**             |
| **Amina:** No, it is worse today.                      | *Reason:* Worsening symptoms reported. |
| **AI:** I am alerting a nurse to call you right away.  | *Action Required:* Call Patient        |
|                                                        |                                        |
|                                                        | [ 📞 Initiate Voice Call ]              |
|                                                        | [ 📅 Book Priority Follow-up ]          |
|                                                        | [ 💬 Message Patient ]                  |

**Component Breakdown:**
* **Communication Log:** Shows a read-only view of the context-aware WhatsApp or SMS conversation handled by the AI Outreach Agent.
* **Flagged Patient Queue:** Patients who report lingering symptoms are instantly pulled into this high-priority dashboard view.
* **Rapid Intervention Tools:** Buttons allowing the nurse to immediately call the patient or book a follow-up appointment directly from the alert screen.